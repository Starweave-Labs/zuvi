import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { URL } from 'node:url';
const require=createRequire(new URL('../package.json',import.meta.url));
const uiRequire=createRequire(new URL('../../packages/ui/package.json',import.meta.url));
const {JSDOM}=uiRequire('jsdom'),dom=new JSDOM().window,ts=require('typescript'),JSZip=require('jszip');
const {Document,Paragraph,TextRun,Packer}=require('docx');
const modules=new Map();
function compile(relative){
  const source=new URL(relative,import.meta.url);
  if(modules.has(source.href))return modules.get(source.href).exports;
  const module={exports:{}};modules.set(source.href,module);
  const output=ts.transpileModule(readFileSync(source,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
  runInNewContext(output,{exports:module.exports,module,require:(id)=>id.startsWith('.')?compile(new URL(`${id}.ts`,source).href):require(id),DOMParser:dom.DOMParser,XMLSerializer:dom.XMLSerializer});
  return module.exports;
}
const model=compile('../../packages/ui/src/components/OfficeStudio/studio-word-numbering.ts');
const codec=compile('../src/pages/collaboration/office-studio/studio-word-numbering-codec.ts');
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const parse=(text)=>new dom.DOMParser().parseFromString(text,'application/xml');
const unwrap=(value)=>JSON.parse(JSON.stringify(value));
const nativeStyle=(id)=>id==='heading-2'?'Heading2':id;
const modelStyle=(id)=>id==='Heading2'?'heading-2':id;
const catalog=()=>({definitions:[{id:'outline',name:'Outline',levels:model.wordDefaultNumbering()},{id:'draft',name:'Unapplied',levels:model.wordDefaultNumbering('lowerRoman')}],instances:[{id:'first',definitionId:'outline'},{id:'second',definitionId:'outline',startOverrides:{'0':7,'1':5}}]});
async function save(data,refs){
  const document=new Document({numbering:{config:codec.nativeWordNumberingConfig(data,nativeStyle)},sections:[{children:refs.map((ref,index)=>new Paragraph({numbering:codec.nativeWordParagraphNumbering(ref,data),children:[new TextRun(`Item ${index}`)]}))}]});
  data.instances.forEach((instance,index)=>document.Numbering.createConcreteNumberingInstance(`zuvi-numbering-${instance.definitionId}`,index));
  const zip=await JSZip.loadAsync(await Packer.toArrayBuffer(document));
  zip.file('word/numbering.xml',codec.patchNativeWordNumbering(await zip.file('word/numbering.xml').async('string'),data,document.Numbering.ConcreteNumbering));
  return await zip.generateAsync({type:'uint8array'});
}
async function reopen(bytes){
  const zip=await JSZip.loadAsync(bytes),content=parse(await zip.file('word/document.xml').async('string'));
  const ids=new Set([...content.getElementsByTagNameNS(W,'numId')].map((entry)=>entry.getAttributeNS(W,'val')));
  const read=codec.readNativeWordNumbering(parse(await zip.file('word/numbering.xml').async('string')),modelStyle,ids);
  const refs=[...content.getElementsByTagNameNS(W,'numPr')].map((entry)=>({
    instanceId:read.references.get(entry.getElementsByTagNameNS(W,'numId')[0].getAttributeNS(W,'val')).instanceId,
    level:Number(entry.getElementsByTagNameNS(W,'ilvl')[0].getAttributeNS(W,'val')),
  }));
  return {data:unwrap(read.catalog),refs,zip};
}
test('native multi-level formats, starts, restart rules, title links and unapplied definitions survive two DOCX cycles',async()=>{
  let data=catalog(),refs=[{instanceId:'first',level:0},{instanceId:'first',level:1},{instanceId:'first',level:1},{instanceId:'second',level:0},{instanceId:'second',level:1}];
  data.definitions[0].levels[0]={...data.definitions[0].levels[0],format:'upperRoman',start:3};
  data.definitions[0].levels[1]={...data.definitions[0].levels[1],format:'lowerLetter',text:'%1.%2)',restartAfter:0,paragraphStyle:'heading-2',fontFamily:'Arial',fontSize:11.5,color:'#aa00ff',bold:true,indentLeft:40,indentFirstLine:-14,tabStops:[{position:40,alignment:'left'}]};
  for(let pass=0;pass<2;pass++){
    const opened=await reopen(await save(data,refs));
    const xml=parse(await opened.zip.file('word/numbering.xml').async('string'));
    assert.equal(xml.getElementsByTagNameNS(W,'lvlText')[10].getAttributeNS(W,'val'),'%1.%2)');
    assert.equal(opened.data.definitions.find((entry)=>entry.id==='outline').levels[1].paragraphStyle,'heading-2');
    assert.equal(opened.data.definitions.find((entry)=>entry.id==='outline').levels[1].restartAfter,0);
    assert.equal(opened.data.definitions.find((entry)=>entry.id==='draft').name,'Unapplied');
    assert.deepEqual(opened.data.instances.find((entry)=>entry.id==='second').startOverrides,{'0':7,'1':5});
    assert.equal(opened.data.instances.find((entry)=>entry.id==='first').startOverrides,undefined);
    data=opened.data;refs=opened.refs;
    const root={type:'doc',content:refs.map((ref)=>({type:'paragraph',attrs:{numbering:ref},content:[{type:'text',text:'Text'}]}))};
    assert.deepEqual(unwrap(model.wordNumberingLabels(root,data).map((label)=>label.text)),['III.','III.a)','III.b)','VII.','VII.e)']);
  }
});
test('default starts continue inheriting after reopening while explicit matching overrides remain direct',async()=>{
  let data=catalog();data.instances[1].startOverrides={'0':1};
  const opened=await reopen(await save(data,[{instanceId:'first',level:0},{instanceId:'second',level:0}]));
  opened.data.definitions.find((entry)=>entry.id==='outline').levels[0].start=9;
  const root={type:'doc',content:opened.refs.map((ref)=>({type:'paragraph',attrs:{numbering:ref}}))};
  assert.deepEqual(unwrap(model.wordNumberingLabels(root,opened.data).map((entry)=>entry.text)),['9.','1.']);
});
test('unused unsupported numbering templates do not reject an otherwise unnumbered file',()=>{
  const read=codec.readNativeWordNumbering(parse(`<w:numbering xmlns:w="${W}"><w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:numFmt w:val="unsupported"/><w:lvlText w:val="%1."/></w:lvl></w:abstractNum><w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num></w:numbering>`),modelStyle,new Set());
  assert.deepEqual(unwrap(read.catalog),{definitions:[],instances:[]});
});
