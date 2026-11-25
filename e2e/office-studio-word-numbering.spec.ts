import { expect, test, type Locator } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {Document,Paragraph,TextRun,Packer,LevelFormat} from '../docs/node_modules/docx/dist/index.mjs';
import JSZip from '../docs/node_modules/jszip/lib/index.js';
const audit=path.resolve('docs/audits/2026-11-25/word-numbering');
async function select(node:Locator){await node.evaluate((element)=>{
  (element.closest('[role="textbox"]') as HTMLElement).focus();
  const range=document.createRange();range.selectNodeContents(element);range.collapse(true);
  const selection=window.getSelection()!;selection.removeAllRanges();selection.addRange(range);document.dispatchEvent(new Event('selectionchange'));
});}
test('native numbering starts, continuation, restart and format changes edit in the actual Word canvas and reopen twice',async({page})=>{
  await mkdir(audit,{recursive:true});
  const levels=Array.from({length:9},(_,index)=>({level:index,format:LevelFormat.DECIMAL,text:index===1?'%1.%2.':`%${index+1}.`,start:index===0?5:1,style:{paragraph:{indent:{left:(index+1)*720,hanging:360}}}}));
  const doc=new Document({numbering:{config:[{reference:'outline',levels}]},sections:[{children:[
    new Paragraph({numbering:{reference:'outline',level:0,instance:0},children:[new TextRun('First')]}),
    new Paragraph({numbering:{reference:'outline',level:0,instance:0},children:[new TextRun('Second')]}),
    new Paragraph({children:[new TextRun('Gap')]}),
    new Paragraph({numbering:{reference:'outline',level:0,instance:1},children:[new TextRun('Third')]}),
    new Paragraph({numbering:{reference:'outline',level:0,instance:1},children:[new TextRun('Fourth')]}),
  ]}]});
  const source=Buffer.from(await Packer.toArrayBuffer(doc));await writeFile(path.join(audit,'numbering-source.docx'),source);
  await page.goto('/#/components/office-studio');
  const load=(name:string,buffer:Buffer)=>page.getByLabel('导入文档文件',{exact:true}).setInputFiles({name,mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer});
  await load('Numbering.docx',source);
  const body=page.getByRole('textbox',{name:'Word 文档正文',exact:true});
  const paragraph=(text:string)=>body.locator('p').filter({hasText:new RegExp(`^${text}$`)});
  for(const [text,label] of [['First','5.'],['Second','6.'],['Third','5.'],['Fourth','6.']])await expect(paragraph(text)).toHaveAttribute('data-word-numbering-label',label);
  await select(paragraph('Third'));await page.getByRole('button',{name:'继续编号',exact:true}).click();
  await expect(paragraph('Third')).toHaveAttribute('data-word-numbering-label','7.');await expect(paragraph('Fourth')).toHaveAttribute('data-word-numbering-label','8.');
  await page.getByRole('button',{name:'撤销',exact:true}).click();await expect(paragraph('Third')).toHaveAttribute('data-word-numbering-label','5.');
  await page.getByRole('button',{name:'重做',exact:true}).click();await expect(paragraph('Third')).toHaveAttribute('data-word-numbering-label','7.');
  await page.getByLabel('编号起始值',{exact:true}).fill('3');await page.getByRole('button',{name:'重新开始编号',exact:true}).click();
  await expect(paragraph('Third')).toHaveAttribute('data-word-numbering-label','3.');await expect(paragraph('Fourth')).toHaveAttribute('data-word-numbering-label','4.');
  await page.getByRole('button',{name:/^编号格式/}).click();await page.getByRole('option',{name:'I, II, III',exact:true}).click();
  await expect(paragraph('Third')).toHaveAttribute('data-word-numbering-label','III.');await expect(paragraph('First')).toHaveAttribute('data-word-numbering-label','V.');
  await select(paragraph('Third'));await page.getByRole('button',{name:'多级编号定义',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'多级编号定义',exact:true});
  await dialog.getByRole('button',{name:'新建编号定义',exact:true}).click();
  await dialog.getByLabel('编号定义名称',{exact:true}).fill('Chapter outline');
  const choose=async(label:string,option:string)=>{await dialog.getByRole('button',{name:new RegExp(`^${label}`)}).click();await page.getByRole('option',{name:option,exact:true}).click();};
  await choose('层级编号格式','I, II, III');await dialog.getByLabel('层级起始编号',{exact:true}).fill('88');
  await dialog.getByLabel('编号字号（pt）',{exact:true}).fill('18');
  await choose('编号关联样式','标题 1');
  await choose('编辑编号层级','第 9 级');await dialog.getByLabel('层级编号模板',{exact:true}).fill('%1.%9)');
  await dialog.getByLabel('层级起始编号',{exact:true}).fill('1.5');await expect(dialog.getByRole('button',{name:'保存编号定义',exact:true})).toBeDisabled();
  await dialog.getByLabel('层级起始编号',{exact:true}).fill('1');await choose('编辑编号层级','第 1 级');
  await dialog.getByRole('button',{name:'保存编号定义',exact:true}).click();
  await expect(paragraph('Third')).toHaveAttribute('data-word-numbering-label','LXXXVIII.');
  await page.getByRole('button',{name:'撤销',exact:true}).click();await expect(paragraph('Third')).toHaveAttribute('data-word-numbering-label','III.');
  await page.getByRole('button',{name:'重做',exact:true}).click();await expect(paragraph('Third')).toHaveAttribute('data-word-numbering-label','LXXXVIII.');
  await select(paragraph('Gap'));await page.getByRole('button',{name:'标题 1样式',exact:true}).click();
  const heading=body.locator('h1').filter({hasText:'Gap'});await expect(heading).toHaveAttribute('data-word-numbering-label','LXXXVIII.');
  await expect(paragraph('Third')).toHaveAttribute('data-word-numbering-label','LXXXIX.');
  await expect.poll(()=>paragraph('Third').evaluate((element)=>parseFloat(getComputedStyle(element).textIndent))).toBeGreaterThan(0);
  for(let pass=1;pass<=2;pass++){
    const download=page.waitForEvent('download');await page.getByRole('button',{name:'导出文件',exact:true}).click();
    const bytes=await readFile((await(await download).path())!);await writeFile(path.join(audit,`numbering-roundtrip-${pass}.docx`),bytes);
    const zip=await JSZip.loadAsync(bytes),xml=await zip.file('word/numbering.xml')!.async('string');
    expect(xml).toContain('upperRoman');expect(xml).toContain('startOverride');
    await load(`Reopened-${pass}.docx`,bytes);await expect(paragraph('Third')).toHaveAttribute('data-word-numbering-label','LXXXIX.');await expect(paragraph('First')).toHaveAttribute('data-word-numbering-label','V.');await expect(heading).toHaveAttribute('data-word-numbering-label','LXXXVIII.');
  }
  await page.evaluate(()=>window.addEventListener('message',(event)=>{if(event.data?.type==='numbering-print') (window as Window & {numberingPrint?:unknown}).numberingPrint=event.data;}));
  await page.addInitScript(()=>{window.print=()=>{
    const paragraph=[...document.querySelectorAll<HTMLElement>('p')].find((entry)=>entry.textContent==='Third')!;
    window.parent.postMessage({type:'numbering-print',label:paragraph.dataset.wordNumberingLabel,indent:parseFloat(getComputedStyle(paragraph).textIndent),text:paragraph.textContent},'*');
    window.dispatchEvent(new Event('afterprint'));
  };});
  await page.getByRole('button',{name:'打印',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>(window as Window & {numberingPrint?:{label:string}}).numberingPrint?.label)).toBe('LXXXIX.');
  expect(await page.evaluate(()=>(window as Window & {numberingPrint?:{indent:number}}).numberingPrint?.indent)).toBeGreaterThan(0);
  expect(await page.evaluate(()=>(window as Window & {numberingPrint?:{text:string}}).numberingPrint?.text)).toBe('Third');
  await body.evaluate((element)=>element.closest('.zuvi-office-studio')?.scrollIntoView({block:'start'}));
  await page.screenshot({path:path.join(audit,'numbering-light.png'),fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:'切换暗色',exact:true}).click();await page.screenshot({path:path.join(audit,'numbering-dark.png'),fullPage:true,animations:'disabled'});
  await page.setViewportSize({width:320,height:720});await select(paragraph('Third'));await expect(page.getByRole('button',{name:'重新开始编号',exact:true})).toBeVisible();
  await page.screenshot({path:path.join(audit,'numbering-dark-320.png'),fullPage:true,animations:'disabled'});
  for(const theme of ['dark','light']){
    if(theme==='light')await page.getByRole('button',{name:'切换浅色',exact:true}).click();
    await select(paragraph('Third'));await page.getByRole('button',{name:'多级编号定义',exact:true}).click();
    const modal=page.getByRole('dialog',{name:'多级编号定义',exact:true});
    await expect(modal.getByRole('button',{name:'保存编号定义',exact:true})).toBeVisible();
    const box=await modal.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.width).toBeLessThanOrEqual(320);
    await page.screenshot({path:path.join(audit,`numbering-definition-${theme}-320.png`),fullPage:true,animations:'disabled'});
    await modal.getByRole('button',{name:'取消',exact:true}).click();
  }
  await page.screenshot({path:path.join(audit,'numbering-light-320.png'),fullPage:true,animations:'disabled'});
  await page.getByRole('switch',{name:'只读预览',exact:true}).click();await expect(page.getByRole('button',{name:'重新开始编号',exact:true})).toBeDisabled();
});
