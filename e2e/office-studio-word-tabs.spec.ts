import { expect, test, type Locator } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Document, Paragraph, TextRun, Tab, Packer, TabStopType, LeaderType, Header, Table, TableRow, TableCell } from '../docs/node_modules/docx/dist/index.mjs';
import JSZip from '../docs/node_modules/jszip/lib/index.js';

const audit = path.resolve('docs/audits/2026-11-25/word-tabs');
async function select(node: Locator) {
  await node.evaluate((element) => {
    (element.closest('[contenteditable="true"]') as HTMLElement).focus();
    const range = document.createRange(); range.selectNodeContents(element);
    const selection = window.getSelection()!; selection.removeAllRanges(); selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
}
async function alignedPosition(node: Locator, alignment: string, decimalCharacter = '.') {
  return node.evaluate((element, { alignment: align, decimalCharacter: symbol }) => {
    const p = element as HTMLElement, tab = p.querySelector('[data-word-tab]')!;
    const scale = p.getBoundingClientRect().width / p.offsetWidth;
    const range = document.createRange(); range.setStartAfter(tab); range.setEnd(p,p.childNodes.length);
    const rect = range.getBoundingClientRect();
    let x = align === 'right' ? rect.right : align === 'center' ? (rect.left + rect.right)/2 : rect.left;
    if (align === 'decimal') {
      const walker = document.createTreeWalker(p,NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const text = walker.currentNode as Text, index = text.data.indexOf(symbol);
        if (index >= 0 && range.intersectsNode(text)) {
          range.setStart(text,index); range.setEnd(text,index+1); x=range.getBoundingClientRect().left; break;
        }
      }
    }
    return (x-p.getBoundingClientRect().left)/scale*0.75;
  }, { alignment, decimalCharacter });
}

test('decimal tabs use the native decimal symbol rather than a thousands separator', async ({ page }) => {
  await mkdir(audit,{recursive:true});
  await page.goto('/#/components/office-studio');
  for (const [symbol, text] of [['.','1,234.50'],[',','1.234,50']] as const) {
    const doc=new Document({sections:[{children:[new Paragraph({tabStops:[{type:TabStopType.DECIMAL,position:3600,leader:LeaderType.DOT}],children:[new TextRun({children:['Group',new Tab(),text]})]})]}]});
    const zip=await JSZip.loadAsync(await Packer.toArrayBuffer(doc));
    zip.file('word/settings.xml',(await zip.file('word/settings.xml')!.async('string')).replace('</w:settings>',`<w:decimalSymbol w:val="${symbol}"/></w:settings>`));
    let bytes=await zip.generateAsync({type:'nodebuffer'});
    const suffix=symbol==='.'?'period':'comma';
    await writeFile(path.join(audit,`tabs-${suffix}-source.docx`),bytes);
    for(let pass=0;pass<=2;pass++){
      await page.getByLabel('导入文档文件',{exact:true}).setInputFiles({name:`Decimal-${suffix}-${pass}.docx`,mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:bytes});
      const paragraph=page.getByRole('textbox',{name:'Word 文档正文',exact:true}).locator('p').filter({hasText:'Group'});
      await expect.poll(()=>alignedPosition(paragraph,'decimal',symbol)).toBeCloseTo(180,0);
      if(pass===2) break;
      const download=page.waitForEvent('download');await page.getByRole('button',{name:'导出文件',exact:true}).click();
      bytes=await readFile((await(await download).path())!);
      await writeFile(path.join(audit,`tabs-${suffix}-roundtrip-${pass+1}.docx`),bytes);
      expect(await(await JSZip.loadAsync(bytes)).file('word/settings.xml')!.async('string')).toContain(`w:decimalSymbol w:val="${symbol}"`);
    }
  }
});

test('Word tab positions and leaders align in the real editor, cancel and undo atomically, print and survive two DOCX reopenings', async ({ page }) => {
  await mkdir(audit,{recursive:true});
  const rows = [
    ['Left',TabStopType.LEFT,'Apple'], ['Center',TabStopType.CENTER,'Mixed width'],
    ['Right',TabStopType.RIGHT,'Tail'], ['Decimal',TabStopType.DECIMAL,'123.45'],
  ] as const;
  const doc = new Document({ defaultTabStop:600, sections:[{
    headers:{default:new Header({children:[new Paragraph({tabStops:[{type:TabStopType.RIGHT,position:2160}],children:[new TextRun({children:['Header',new Tab(),'Text']})]})]})},
    children:[...rows.map(([label,type,text]) => new Paragraph({ tabStops:[{type,position:3600,leader:LeaderType.DOT}], children:[new TextRun(label),new TextRun({children:[new Tab()]}),new TextRun({text,bold:true})] })),
      new Table({rows:[new TableRow({children:[new TableCell({children:[new Paragraph({tabStops:[{type:TabStopType.LEFT,position:1440,leader:LeaderType.HYPHEN}],children:[new TextRun({children:['Cell',new Tab(),'Aligned']})]})]})]})]}),
    ],
  }]});
  const source=Buffer.from(await Packer.toArrayBuffer(doc));
  await writeFile(path.join(audit,'tabs-source.docx'),source);
  await page.goto('/#/components/office-studio');
  const importFile=(name:string,buffer:Buffer)=>page.getByLabel('导入文档文件',{exact:true}).setInputFiles({name,mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer});
  await importFile('Tabs.docx',source);
  const body=page.getByRole('textbox',{name:'Word 文档正文',exact:true});
  const paragraph=(label:string)=>body.locator('p').filter({hasText:new RegExp(`^${label}`)});
  await expect(paragraph('Decimal').locator('[data-word-tab]')).toBeVisible();
  for(const [label,alignment] of rows) await expect.poll(()=>alignedPosition(paragraph(label),alignment)).toBeCloseTo(180,0);
  await expect.poll(()=>alignedPosition(paragraph('Cell'),'left')).toBeCloseTo(72,0);
  const header=page.getByRole('textbox',{name:'Word 页眉',exact:true});
  await expect.poll(()=>alignedPosition(header.locator('p'),'right')).toBeCloseTo(108,0);
  const open=async()=>{await expect(body).toHaveAttribute('contenteditable','true');await select(paragraph('Decimal'));await page.getByRole('button',{name:'制表位',exact:true}).click();return page.getByRole('dialog',{name:'制表位',exact:true});};
  let dialog=await open();
  await dialog.getByRole('button',{name:/^180pt/}).click();
  await dialog.getByLabel('制表位位置（pt）',{exact:true}).fill('210.05');
  await dialog.getByRole('button',{name:'应用制表位',exact:true}).click();
  await expect.poll(()=>alignedPosition(paragraph('Decimal'),'decimal')).toBeCloseTo(210.05,0);
  await page.getByRole('button',{name:'撤销',exact:true}).click();
  await expect.poll(()=>alignedPosition(paragraph('Decimal'),'decimal')).toBeCloseTo(180,0);
  await page.getByRole('button',{name:'重做',exact:true}).click();
  await expect.poll(()=>alignedPosition(paragraph('Decimal'),'decimal')).toBeCloseTo(210.05,0);
  dialog=await open();
  await dialog.getByLabel('制表位位置（pt）',{exact:true}).fill('12.03');
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(dialog.getByRole('button',{name:'应用制表位',exact:true})).toBeDisabled();
  await dialog.getByRole('button',{name:'取消',exact:true}).click();
  await expect.poll(()=>alignedPosition(paragraph('Decimal'),'decimal')).toBeCloseTo(210.05,0);
  dialog=await open();
  await dialog.getByRole('button',{name:'全部清除',exact:true}).click();
  await dialog.getByRole('button',{name:'应用制表位',exact:true}).click();
  await expect(paragraph('Decimal').locator('[data-word-tab]')).toHaveAttribute('data-word-leader','none');
  await page.getByRole('button',{name:'撤销',exact:true}).click();
  await expect.poll(()=>alignedPosition(paragraph('Decimal'),'decimal')).toBeCloseTo(210.05,0);
  // A view marker and zoom changes preserve native text and alignment.
  const text=await body.textContent();
  await page.getByRole('button',{name:'显示非打印字符',exact:true}).click();
  expect(await body.textContent()).toBe(text);
  await page.getByRole('button',{name:/^Word 缩放/}).click();
  await page.getByRole('option',{name:'75%',exact:true}).click();
  await expect.poll(()=>alignedPosition(paragraph('Decimal'),'decimal')).toBeCloseTo(210.05,0);
  await select(paragraph('Left'));
  await paragraph('Left').evaluate(()=>window.getSelection()!.collapseToEnd());
  await page.getByRole('button',{name:'插入制表符',exact:true}).click();
  expect(await paragraph('Left').textContent()).toBe('Left\tApple\t');
  await page.getByRole('button',{name:'撤销',exact:true}).click();
  expect(await paragraph('Left').textContent()).toBe('Left\tApple');
  await page.getByRole('button',{name:'重做',exact:true}).click();
  await body.pressSequentially('Added');
  expect(await paragraph('Left').textContent()).toBe('Left\tApple\tAdded');
  for(let pass=1;pass<=2;pass++){
    const download=page.waitForEvent('download');await page.getByRole('button',{name:'导出文件',exact:true}).click();
    const bytes=await readFile((await(await download).path())!);await writeFile(path.join(audit,`tabs-roundtrip-${pass}.docx`),bytes);
    const zip=await JSZip.loadAsync(bytes),xml=await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('w:pos="4201"');expect(xml).toContain('w:val="decimal"');expect(xml).toContain('w:leader="dot"');
    expect(await zip.file('word/settings.xml')!.async('string')).toContain('w:defaultTabStop w:val="600"');
    await importFile(`Reopened-${pass}.docx`,bytes);
    await expect.poll(()=>alignedPosition(paragraph('Decimal'),'decimal')).toBeCloseTo(210.05,0);
    await expect.poll(()=>alignedPosition(paragraph('Cell'),'left')).toBeCloseTo(72,0);
  }
  await page.evaluate(() => window.addEventListener('message',(event) => {
    if(event.data?.type==='zuvi-tabs-print') (window as Window & { tabPrint?: unknown }).tabPrint=event.data;
  }));
  await page.addInitScript(() => {
    window.print=()=>{
      const p=[...document.querySelectorAll<HTMLElement>('article p')].find((item)=>item.textContent?.startsWith('Decimal'))!;
      const walker=document.createTreeWalker(p,NodeFilter.SHOW_TEXT),range=document.createRange();
      let position=NaN;
      while(walker.nextNode()){
        const text=walker.currentNode as Text,index=text.data.indexOf('.');
        if(index<0)continue;
        range.setStart(text,index);range.setEnd(text,index+1);
        position=(range.getBoundingClientRect().left-p.getBoundingClientRect().left)*0.75;break;
      }
      window.parent.postMessage({type:'zuvi-tabs-print',position,text:p.textContent,leader:p.querySelector<HTMLElement>('[data-word-tab]')?.dataset.wordLeader},'*');
      window.dispatchEvent(new Event('afterprint'));
    };
  });
  await page.getByRole('button',{name:'打印',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>(window as Window & {tabPrint?:{position:number}}).tabPrint?.position)).toBeCloseTo(210.05,0);
  expect(await page.evaluate(()=>(window as Window & {tabPrint?:{text:string}}).tabPrint?.text)).toBe('Decimal\t123.45');
  expect(await page.evaluate(()=>(window as Window & {tabPrint?:{leader:string}}).tabPrint?.leader)).toBe('dot');
  await body.evaluate((element)=>element.closest('.zuvi-office-studio')?.scrollIntoView({block:'start'}));
  await page.screenshot({path:path.join(audit,'tabs-results-light.png'),fullPage:true,animations:'disabled'});
  for(const small of [false,true]){
    if(small)await page.setViewportSize({width:320,height:720});
    for(const theme of ['light','dark']){
      if(theme==='dark')await page.getByRole('button',{name:'切换暗色',exact:true}).click();
      dialog=await open();await expect(dialog.getByRole('button',{name:'应用制表位',exact:true})).toBeVisible();
      const rect=await dialog.boundingBox();expect(rect!.x).toBeGreaterThanOrEqual(0);expect(rect!.width).toBeLessThanOrEqual(small?320:1280);
      await page.screenshot({path:path.join(audit,`tabs-dialog-${theme}${small?'-320':''}.png`),fullPage:true,animations:'disabled'});
      await dialog.press('Escape');if(theme==='dark')await page.getByRole('button',{name:'切换浅色',exact:true}).click();
    }
  }
  await page.getByRole('switch',{name:'只读预览',exact:true}).click();
  await expect(page.getByRole('button',{name:'制表位',exact:true})).toBeDisabled();
  await expect(page.getByRole('button',{name:'插入制表符',exact:true})).toBeDisabled();
});
