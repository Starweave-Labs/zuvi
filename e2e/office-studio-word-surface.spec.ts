import {expect,test,type Locator} from '@playwright/test';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {Document,Paragraph,TextRun,Packer,BorderStyle,ShadingType} from '../docs/node_modules/docx/dist/index.mjs';
import JSZip from '../docs/node_modules/jszip/lib/index.js';
const audit=path.resolve('docs/audits/2026-11-26/word-surface');
async function select(node:Locator){await node.evaluate((element)=>{
  (element.closest('[role="textbox"]') as HTMLElement).focus();const range=document.createRange();range.selectNodeContents(element);const selection=window.getSelection()!;selection.removeAllRanges();selection.addRange(range);document.dispatchEvent(new Event('selectionchange'));
});}
test('paragraph borders and shading edit per side, cancel and undo atomically, print and reopen real DOCX twice',async({page})=>{
  await mkdir(audit,{recursive:true});
  const doc=new Document({sections:[{children:[new Paragraph({border:{left:{style:BorderStyle.SINGLE,size:8,space:3,color:'112233'}},shading:{type:ShadingType.CLEAR,fill:'FFEECC'},children:[new TextRun({text:'First surface',bold:true})]}),new Paragraph({border:{bottom:{style:BorderStyle.DOTTED,size:4,color:'556677'}},children:[new TextRun('Second surface')]})]}]});
  const source=Buffer.from(await Packer.toArrayBuffer(doc));await writeFile(path.join(audit,'surface-source.docx'),source);
  await page.goto('/#/components/office-studio');
  const load=(name:string,buffer:Buffer)=>page.getByLabel('导入文档文件',{exact:true}).setInputFiles({name,mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer});
  await load('Surface.docx',source);const body=page.getByRole('textbox',{name:'Word 文档正文',exact:true});
  const first=body.locator('p').filter({hasText:'First surface'}),second=body.locator('p').filter({hasText:'Second surface'});
  await expect(first).toHaveCSS('border-left-color','rgb(17, 34, 51)');await expect(first).toHaveCSS('padding-left','4px');
  await select(body);await page.getByRole('button',{name:'段落边框与底纹',exact:true}).click();
  let dialog=page.getByRole('dialog',{name:'段落边框与底纹',exact:true});
  const choose=async(label:string,value:string)=>{await dialog.getByRole('button',{name:new RegExp(`^${label}`)}).click();await page.getByRole('option',{name:value,exact:true}).click();};
  await choose('段落边框边位','右边');await choose('段落边框线型','虚线');
  await dialog.getByLabel('段落边框宽度（pt）',{exact:true}).fill('1.5');await dialog.getByLabel('段落边框距文字（pt）',{exact:true}).fill('4');await dialog.getByLabel('段落边框颜色',{exact:true}).fill('#445566');
  await dialog.getByLabel('段落底纹底色',{exact:true}).fill('#ccffee');await choose('段落底纹图案','纯底色');
  await dialog.getByRole('button',{name:'应用段落边框底纹',exact:true}).click();
  await expect(first).toHaveCSS('border-right-style','dashed');await expect(second).toHaveCSS('border-right-color','rgb(68, 85, 102)');await expect(first).toHaveCSS('background-color','rgb(204, 255, 238)');
  await expect(first).toHaveCSS('border-left-style','solid');await expect(second).toHaveCSS('border-bottom-style','dotted');
  await page.getByRole('button',{name:'撤销',exact:true}).click();await expect(first).toHaveCSS('border-right-style','none');await page.getByRole('button',{name:'重做',exact:true}).click();await expect(first).toHaveCSS('border-right-style','dashed');
  await select(first);await page.getByRole('button',{name:'段落边框与底纹',exact:true}).click();
  dialog=page.getByRole('dialog',{name:'段落边框与底纹',exact:true});await dialog.getByLabel('段落边框宽度（pt）',{exact:true}).fill('.3');await expect(dialog.getByRole('button',{name:'应用段落边框底纹',exact:true})).toBeDisabled();await dialog.getByRole('button',{name:'取消',exact:true}).click();await expect(first).toHaveCSS('border-right-style','dashed');
  for(let pass=1;pass<=2;pass++){
    const download=page.waitForEvent('download');await page.getByRole('button',{name:'导出文件',exact:true}).click();const bytes=await readFile((await(await download).path())!);await writeFile(path.join(audit,`surface-roundtrip-${pass}.docx`),bytes);
    const zip=await JSZip.loadAsync(bytes),xml=await zip.file('word/document.xml')!.async('string');expect(xml).toContain('w:right');expect(xml).toContain('w:space="4"');expect(xml).toContain('w:fill="ccffee"');
    await load(`Reopened-${pass}.docx`,bytes);await expect(first).toHaveCSS('border-right-style','dashed');await expect(second).toHaveCSS('border-bottom-style','dotted');
  }
  await page.evaluate(()=>window.addEventListener('message',(event)=>{if(event.data?.type==='surface-print')(window as Window&{surfacePrint?:unknown}).surfacePrint=event.data;}));
  await page.addInitScript(()=>{window.print=()=>{const p=[...document.querySelectorAll('p')].find((entry)=>entry.textContent==='First surface')!;const css=getComputedStyle(p);window.parent.postMessage({type:'surface-print',border:css.borderRightStyle,color:css.backgroundColor,text:p.textContent},'*');window.dispatchEvent(new Event('afterprint'));};});
  await page.getByRole('button',{name:'打印',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as Window&{surfacePrint?:{border:string}}).surfacePrint?.border)).toBe('dashed');
  expect(await page.evaluate(()=>(window as Window&{surfacePrint?:{color:string}}).surfacePrint?.color)).toBe('rgb(204, 255, 238)');
  await body.evaluate((element)=>element.closest('.zuvi-office-studio')?.scrollIntoView({block:'start'}));await page.screenshot({path:path.join(audit,'surface-results-light.png'),fullPage:true,animations:'disabled'});
  for(const small of [false,true]){
    if(small)await page.setViewportSize({width:320,height:720});
    for(const theme of ['light','dark']){
      if(theme==='dark')await page.getByRole('button',{name:'切换暗色',exact:true}).click();await select(first);await page.getByRole('button',{name:'段落边框与底纹',exact:true}).click();dialog=page.getByRole('dialog',{name:'段落边框与底纹',exact:true});await expect(dialog.getByRole('button',{name:'应用段落边框底纹',exact:true})).toBeVisible();const box=await dialog.boundingBox();expect(box!.width).toBeLessThanOrEqual(small?320:1280);await page.screenshot({path:path.join(audit,`surface-dialog-${theme}${small?'-320':''}.png`),fullPage:true,animations:'disabled'});await dialog.getByRole('button',{name:'取消',exact:true}).click();if(theme==='dark')await page.getByRole('button',{name:'切换浅色',exact:true}).click();
    }
  }
  await page.getByRole('switch',{name:'只读预览',exact:true}).click();await expect(page.getByRole('button',{name:'段落边框与底纹',exact:true})).toBeDisabled();
});
