# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-word-keep.spec.ts >> inline picture height moves its own line before the page boundary
- Location: e2e/office-studio-word-keep.spec.ts:18:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Target page, context or browser has been closed
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - button "正在加载文档菜单" [disabled] [ref=e6] [cursor=pointer]: 菜单
        - link "Z ZUVI" [ref=e7] [cursor=pointer]:
          - /url: "#/"
          - generic [ref=e8]: Z
          - generic [ref=e9]: ZUVI
      - generic [ref=e10]:
        - button "打开文档命令面板" [ref=e11] [cursor=pointer]
        - button "切换浅色" [active] [pressed] [ref=e15] [cursor=pointer]
      - status
    - main [ref=e16]:
      - generic [ref=e17]:
        - heading "OfficeStudio 独立文档工作台" [level=1] [ref=e18]
        - paragraph [ref=e19]: 使用 ZUVI 的工具栏、菜单和表单，在页面内直接编辑文档。Word、Excel、PDF 共用文件操作与保存状态，编辑内容保存在当前浏览器，也可以导出为实际文件。
        - generic [ref=e20]:
          - generic [ref=e21]: ZUVI 界面
          - generic [ref=e23]: 页面内编辑
          - generic [ref=e25]: 本地恢复
          - generic [ref=e27]: DOCX / XLSX / PDF
        - region "从预览，到完成一份文档" [ref=e29]:
          - generic [ref=e30]:
            - heading "从预览，到完成一份文档" [level=3] [ref=e31]
            - paragraph [ref=e32]: 选择一种文档开始。修改会自动保存到当前浏览器；导出后可在 Word、Excel 或 PDF 阅读器中继续使用。
          - generic [ref=e34]:
            - group "选择示例文档" [ref=e35]:
              - button "Word 文档排版 · 图片与页眉页脚" [pressed] [ref=e36] [cursor=pointer]:
                - generic [ref=e37]:
                  - generic [aria-hidden] [ref=e38]: W
                  - generic [ref=e39]:
                    - strong [ref=e40]: Word
                    - generic [ref=e41]: 文档排版 · 图片与页眉页脚
              - button "Excel 行列编辑 · 公式与图表" [ref=e42] [cursor=pointer]:
                - generic [ref=e43]:
                  - generic [aria-hidden] [ref=e44]: E
                  - generic [ref=e45]:
                    - strong [ref=e46]: Excel
                    - generic [ref=e47]: 行列编辑 · 公式与图表
              - button "PDF 全文查找 · 批注与手写" [ref=e48] [cursor=pointer]:
                - generic [ref=e49]:
                  - generic [aria-hidden] [ref=e50]: P
                  - generic [ref=e51]:
                    - strong [ref=e52]: PDF
                    - generic [ref=e53]: 全文查找 · 批注与手写
            - generic [ref=e54]:
              - generic [ref=e55]:
                - generic [ref=e56]: 打开本地文档
                - button "打开本地文档 Inline-reopened-2.docx" [ref=e57] [cursor=pointer]:
                  - generic [ref=e58]: Inline-reopened-2.docx
              - button "历史版本" [ref=e59] [cursor=pointer]
              - switch "只读预览" [ref=e61] [cursor=pointer]
            - region "Word 文档编辑器" [ref=e65]:
              - generic [ref=e66]:
                - generic "可编辑 · ⌘ / Ctrl S 保存" [ref=e72]:
                  - status "已保存" [ref=e73]
                - textbox "文档名称" [ref=e77]: Inline-reopened-2.docx
                - generic [ref=e78]:
                  - button "新建" [ref=e80] [cursor=pointer]
                  - button "导入" [ref=e83] [cursor=pointer]
                  - button "导出文件" [ref=e88] [cursor=pointer]
                  - button "打印" [ref=e94] [cursor=pointer]
                  - button "保存" [ref=e101] [cursor=pointer]
                  - button "全屏编辑" [ref=e108] [cursor=pointer]
              - generic [ref=e116]:
                - generic [ref=e117]:
                  - generic [ref=e118]:
                    - button "文件" [ref=e121] [cursor=pointer]
                    - tablist "Word 工具" [ref=e122]:
                      - tab "开始" [ref=e123] [cursor=pointer]
                      - tab "插入" [ref=e124] [cursor=pointer]
                      - tab "布局" [ref=e125] [cursor=pointer]
                      - tab "引用" [ref=e126] [cursor=pointer]
                      - tab "审阅" [ref=e127] [cursor=pointer]
                      - tab "视图" [selected] [ref=e128] [cursor=pointer]
                  - tabpanel "视图" [ref=e129]:
                    - group "显示" [ref=e130]:
                      - generic [ref=e131]:
                        - generic [ref=e132] [cursor=pointer]:
                          - checkbox "标尺" [checked] [ref=e133]
                          - generic [ref=e135]: 标尺
                        - generic [ref=e136] [cursor=pointer]:
                          - checkbox "分页布局" [checked] [ref=e137]
                          - generic [ref=e139]: 分页布局
                        - generic [ref=e140] [cursor=pointer]:
                          - checkbox "非打印字符" [ref=e141]
                          - generic [ref=e143]: 非打印字符
                        - generic [ref=e144] [cursor=pointer]:
                          - checkbox "导航窗格" [ref=e145]
                          - generic [ref=e147]: 导航窗格
                    - group "缩放" [ref=e149]:
                      - generic [ref=e150]:
                        - button "100% 实际大小" [ref=e151] [cursor=pointer]:
                          - generic [ref=e152]:
                            - generic [ref=e153]: 100%
                            - generic [ref=e154]: 实际大小
                        - button "适应宽度" [pressed] [ref=e155] [cursor=pointer]
                - generic [ref=e162]:
                  - toolbar "Word 文档工具" [ref=e163]:
                    - button "打开查找与替换" [ref=e164] [cursor=pointer]
                    - button "打开文档大纲" [ref=e169] [cursor=pointer]
                    - button "打开字数统计" [ref=e173] [cursor=pointer]
                  - generic [ref=e178]:
                    - generic "段落缩进标尺" [ref=e179]:
                      - generic [aria-hidden] [ref=e181]: "0"
                      - generic [aria-hidden] [ref=e182]: "1"
                      - generic [aria-hidden] [ref=e183]: "2"
                      - generic [aria-hidden] [ref=e184]: "3"
                      - generic [aria-hidden] [ref=e185]: "4"
                      - generic [aria-hidden] [ref=e186]: "5"
                      - generic [aria-hidden] [ref=e187]: "6"
                      - generic [aria-hidden] [ref=e188]: "7"
                      - generic [aria-hidden] [ref=e189]: "8"
                      - generic [aria-hidden] [ref=e190]: "9"
                      - generic [aria-hidden] [ref=e191]: "10"
                      - generic [aria-hidden] [ref=e192]: "11"
                      - generic [aria-hidden] [ref=e193]: "12"
                      - generic [aria-hidden] [ref=e194]: "13"
                      - generic [aria-hidden] [ref=e195]: "14"
                      - generic [aria-hidden] [ref=e196]: "15"
                      - slider "首行缩进标尺" [ref=e197] [cursor=pointer]
                      - slider "悬挂缩进标尺" [ref=e199] [cursor=pointer]
                      - slider "左缩进标尺" [ref=e201] [cursor=pointer]
                      - slider "右缩进标尺" [ref=e203] [cursor=pointer]
                    - generic [ref=e205]:
                      - generic [aria-hidden]:
                        - generic [aria-hidden]: "0"
                        - generic [aria-hidden]: "1"
                        - generic [aria-hidden]: "2"
                        - generic [aria-hidden]: "3"
                        - generic [aria-hidden]: "4"
                        - generic [aria-hidden]: "5"
                        - generic [aria-hidden]: "6"
                        - generic [aria-hidden]: "7"
                        - generic [aria-hidden]: "8"
                        - generic [aria-hidden]: "9"
                        - generic [aria-hidden]: "10"
                        - generic [aria-hidden]: "11"
                        - generic [aria-hidden]: "12"
                        - generic [aria-hidden]: "13"
                        - generic [aria-hidden]: "14"
                        - generic [aria-hidden]: "15"
                        - generic [aria-hidden]: "16"
                        - generic [aria-hidden]: "17"
                        - generic [aria-hidden]: "18"
                        - generic [aria-hidden]: "19"
                        - generic [aria-hidden]: "20"
                        - generic [aria-hidden]: "21"
                        - generic [aria-hidden]: "22"
                        - generic [aria-hidden]: "23"
                        - generic [aria-hidden]: "24"
                      - article "文档纸张" [ref=e206]:
                        - region "页眉区域" [ref=e207]
                        - textbox "Word 文档正文" [ref=e209]:
                          - paragraph [ref=e210]: Picture filler 0Picture filler 1Picture filler 2Picture filler 3Picture filler 4Picture filler 5Picture filler 6Picture filler 7Picture filler 8Picture filler 9Picture filler 10Picture filler 11Picture filler 12Picture filler 13Picture filler 14Picture filler 15Picture filler 16Picture filler 17Picture filler 18Picture filler 19Picture filler 20Picture filler 21Picture filler 22Picture filler 23Picture filler 24Picture filler 25Picture filler 26Picture filler 27Picture filler 28Picture filler 29Picture filler 30Picture filler 31Picture filler 32Picture filler 33Picture filler 34Picture filler 35Picture filler 36
                          - paragraph [ref=e211]:
                            - generic [aria-hidden]: 第 1 页结束
                            - img "分页图片" [ref=e214]
                            - text: After picture
                        - region "页脚区域" [ref=e215]
                - generic [ref=e216]:
                  - generic [ref=e217]: 557 字 · A4 · 纵向
                  - generic [ref=e218]:
                    - generic [ref=e219]: 缩放
                    - generic [ref=e220]:
                      - generic [ref=e221]: Word 缩放
                      - button "Word 缩放 适应宽度" [ref=e222] [cursor=pointer]:
                        - generic [ref=e223]: 适应宽度
            - paragraph [ref=e224]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
          - group [ref=e225]:
            - generic "示例代码" [ref=e226] [cursor=pointer]:
              - generic [aria-hidden] [ref=e227]: </>
              - text: 示例代码
              - generic [aria-hidden] [ref=e228]: 展开 / 收起
        - heading "编辑能力" [level=2] [ref=e229]
        - table [ref=e231]:
          - rowgroup [ref=e232]:
            - row [ref=e233]:
              - columnheader "文档" [ref=e234]
              - columnheader "支持的操作" [ref=e235]
              - columnheader "当前范围" [ref=e236]
          - rowgroup [ref=e237]:
            - row [ref=e238]:
              - cell "Word" [ref=e239]
              - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=e240]
              - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=e241]
            - row [ref=e242]:
              - cell "Excel" [ref=e243]
              - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=e244]
              - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=e245]
            - row [ref=e246]:
              - cell "PDF" [ref=e247]
              - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=e248]
              - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=e249]
        - heading "组件接入" [level=2] [ref=e250]
        - paragraph [ref=e251]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
        - paragraph [ref=e252]:
          - text: PDF 的 worker、字体与渲染由
          - code [ref=e253]: pdfRenderer
          - text: 提供。本页的适配代码位于
          - code [ref=e254]: docs/src/pages/collaboration/office-studio/
          - text: 。组件自 v0.4.0 起随
          - code [ref=e255]: "@zuvi/react"
          - text: 和 Registry 发布。
        - region "组件属性表，可横向滚动" [ref=e256]:
          - table [ref=e257]:
            - rowgroup [ref=e258]:
              - row [ref=e259]:
                - columnheader "属性名" [ref=e260]
                - columnheader "类型" [ref=e261]
                - columnheader "默认值" [ref=e262]
                - columnheader "说明" [ref=e263]
            - rowgroup [ref=e264]:
              - row [ref=e265]:
                - cell "value / defaultValue" [ref=e266]
                - cell [ref=e267]:
                  - code [ref=e268]: OfficeStudioDocument
                - cell [ref=e269]:
                  - code [ref=e270]: —
                - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=e271]
              - row [ref=e272]:
                - cell "onChange" [ref=e273]
                - cell [ref=e274]:
                  - code [ref=e275]: (document) => void
                - cell [ref=e276]:
                  - code [ref=e277]: —
                - cell "内容或文件名称变化。" [ref=e278]
              - row [ref=e279]:
                - cell "source / pdfRenderer" [ref=e280]
                - cell [ref=e281]:
                  - code [ref=e282]: Blob / StudioPdfRenderer
                - cell [ref=e283]:
                  - code [ref=e284]: —
                - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=e285]
              - row [ref=e286]:
                - cell "onSave / onExport / onPrint" [ref=e287]
                - cell [ref=e288]:
                  - code [ref=e289]: (document) => void | Promise<void>
                - cell [ref=e290]:
                  - code [ref=e291]: —
                - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=e292]
              - row [ref=e293]:
                - cell "onImport / onCreate" [ref=e294]
                - cell [ref=e295]:
                  - code [ref=e296]: (file | kind) => void | Promise<void>
                - cell [ref=e297]:
                  - code [ref=e298]: —
                - cell "宿主解析文件或创建模型，并更新受控值。" [ref=e299]
              - row [ref=e300]:
                - cell "readOnly / disabled" [ref=e301]
                - cell [ref=e302]:
                  - code [ref=e303]: boolean
                - cell [ref=e304]:
                  - code [ref=e305]: "false"
                - cell "只读预览或禁用编辑与文件操作。" [ref=e306]
              - row [ref=e307]:
                - cell "saveState" [ref=e308]
                - cell [ref=e309]:
                  - code [ref=e310]: "'saved' | 'saving' | 'unsaved' | 'error'"
                - cell [ref=e311]:
                  - code [ref=e312]: —
                - cell "宿主自动保存状态。" [ref=e313]
              - row [ref=e314]:
                - cell "height" [ref=e315]
                - cell [ref=e316]:
                  - code [ref=e317]: number | string
                - cell [ref=e318]:
                  - code [ref=e319]: "760"
                - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=e320]
              - row [ref=e321]:
                - cell "fullscreen / onFullscreenChange" [ref=e322]
                - cell [ref=e323]:
                  - code [ref=e324]: boolean / (value) => void
                - cell [ref=e325]:
                  - code [ref=e326]: —
                - cell "全屏布局，切换时编辑内容保持挂载。" [ref=e327]
              - row [ref=e328]:
                - cell "ref" [ref=e329]
                - cell [ref=e330]:
                  - code [ref=e331]: OfficeStudioHandle
                - cell [ref=e332]:
                  - code [ref=e333]: —
                - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=e334]
              - row [ref=e335]:
                - cell "classNames" [ref=e336]
                - cell [ref=e337]:
                  - code [ref=e338]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
                - cell [ref=e339]:
                  - code [ref=e340]: —
                - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=e341]
  - text: ✓ ✓
```

# Test source

```ts
  18  | test('inline picture height moves its own line before the page boundary', async ({ page }) => {
  19  |   const document = new Document({
  20  |     sections: [
  21  |       {
  22  |         children: [
  23  |           new Paragraph({
  24  |             widowControl: false,
  25  |             spacing: { line: 360, lineRule: LineRuleType.EXACT },
  26  |             children: Array.from(
  27  |               { length: 37 },
  28  |               (_, index) => new TextRun({ text: `Picture filler ${index}`, break: index ? 1 : 0 })
  29  |             ),
  30  |           }),
  31  |           new Paragraph({
  32  |             widowControl: false,
  33  |             children: [
  34  |               new ImageRun({
  35  |                 type: 'png',
  36  |                 data: Buffer.from(
  37  |                   'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y3nRmwAAAAASUVORK5CYII=',
  38  |                   'base64'
  39  |                 ),
  40  |                 transformation: { width: 180, height: 200 },
  41  |                 altText: { name: '分页图片', title: '分页图片', description: '分页图片' },
  42  |               }),
  43  |               new TextRun({ text: 'After picture', break: 1 }),
  44  |             ],
  45  |           }),
  46  |         ],
  47  |       },
  48  |     ],
  49  |   });
  50  |   const pictureAudit = path.resolve('docs/audits/2026-11-26/word-inline-pagination');
  51  |   await mkdir(pictureAudit, { recursive: true });
  52  |   const source = Buffer.from(await Packer.toArrayBuffer(document));
  53  |   await writeFile(path.join(pictureAudit, 'inline-source.docx'), source);
  54  |   await page.goto('/#/components/office-studio');
  55  |   await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
  56  |     name: 'Inline-page.docx',
  57  |     mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  58  |     buffer: source,
  59  |   });
  60  |   const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  61  |   await expect(body.getByRole('img', { name: '分页图片' })).toBeVisible();
  62  |   await page.getByRole('tab', { name: '视图', exact: true }).click();
  63  |   await page.getByRole('checkbox', { name: '分页布局', exact: true }).click();
  64  |   const paragraph = body.locator('p').filter({ has: page.getByRole('img', { name: '分页图片' }) });
  65  |   await expect(paragraph).toHaveAttribute('data-word-page-first', '2');
  66  |   await expect(paragraph).toHaveAttribute('data-word-page-last', '2');
  67  |   await expect(body).toHaveAttribute('data-word-pagination-overflow', 'false');
  68  |   const image = body.getByRole('img', { name: '分页图片' });
  69  |   const gap = body.locator('[data-word-auto-page-gap]').first();
  70  |   await expect(gap).toHaveCount(1);
  71  |   expect((await image.boundingBox())!.y).toBeGreaterThanOrEqual(
  72  |     (await gap.boundingBox())!.y + (await gap.boundingBox())!.height - 1
  73  |   );
  74  |   await image.click();
  75  |   await page.getByRole('tab', { name: '插入', exact: true }).click();
  76  |   await page.getByRole('checkbox', { name: '保持比例', exact: true }).uncheck();
  77  |   await page.getByRole('spinbutton', { name: '图片高度', exact: true }).fill('240');
  78  |   await expect(image).toHaveAttribute('height', '240');
  79  |   await page.getByRole('tab', { name: '开始', exact: true }).click();
  80  |   await page.getByRole('button', { name: '撤销', exact: true }).click();
  81  |   await expect(image).toHaveAttribute('height', '200');
  82  |   await page.getByRole('button', { name: '重做', exact: true }).click();
  83  |   await expect(image).toHaveAttribute('height', '240');
  84  |   for (let pass = 1; pass <= 2; pass++) {
  85  |     const pending = page.waitForEvent('download');
  86  |     await page.getByRole('button', { name: '导出文件', exact: true }).click();
  87  |     const bytes = await readFile((await (await pending).path())!);
  88  |     await writeFile(path.join(pictureAudit, `inline-roundtrip-${pass}.docx`), bytes);
  89  |     const xml = await (await JSZip.loadAsync(bytes)).file('word/document.xml')!.async('string');
  90  |     expect(xml).toContain('cy="2286000"');
  91  |     expect(xml).not.toContain('data-word-auto-page-gap');
  92  |     await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
  93  |       name: `Inline-reopened-${pass}.docx`,
  94  |       mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  95  |       buffer: bytes,
  96  |     });
  97  |     await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
  98  |       `Inline-reopened-${pass}.docx`
  99  |     );
  100 |     await expect(image).toHaveAttribute('height', '240');
  101 |     await page.getByRole('tab', { name: '视图', exact: true }).click();
  102 |     if (!(await page.getByRole('checkbox', { name: '分页布局', exact: true }).isChecked()))
  103 |       await page.getByRole('checkbox', { name: '分页布局', exact: true }).click();
  104 |     await expect(paragraph).toHaveAttribute('data-word-page-first', '2');
  105 |     await expect(paragraph).toHaveAttribute('data-word-page-last', '2');
  106 |   }
  107 |   await body.getByRole('img', { name: '分页图片' }).scrollIntoViewIfNeeded();
  108 |   await page.screenshot({ path: path.join(pictureAudit, 'inline-page-light.png'), fullPage: true });
  109 |   await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  110 |   await page.screenshot({ path: path.join(pictureAudit, 'inline-page-dark.png'), fullPage: true });
  111 |   await page.setViewportSize({ width: 320, height: 720 });
  112 |   await image.scrollIntoViewIfNeeded();
  113 |   await expect(paragraph).toHaveAttribute('data-word-page-first', '2');
  114 |   await page.screenshot({
  115 |     path: path.join(pictureAudit, 'inline-page-dark-320.png'),
  116 |     fullPage: true,
  117 |   });
> 118 |   await page.getByRole('button', { name: '切换浅色', exact: true }).click();
      |                                                                 ^ Error: locator.click: Target page, context or browser has been closed
  119 |   await page.screenshot({
  120 |     path: path.join(pictureAudit, 'inline-page-light-320.png'),
  121 |     fullPage: true,
  122 |   });
  123 |   await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  124 |   await image.click();
  125 |   await page.getByRole('tab', { name: '插入', exact: true }).click();
  126 |   await expect(page.getByRole('spinbutton', { name: '图片高度', exact: true })).toBeDisabled();
  127 | });
  128 | async function pdfPageText(bytes: Buffer) {
  129 |   if (!('withResolvers' in Promise))
  130 |     Object.defineProperty(Promise, 'withResolvers', {
  131 |       configurable: true,
  132 |       value: function () {
  133 |         let resolve: unknown, reject: unknown;
  134 |         const promise = new Promise((yes, no) => {
  135 |           resolve = yes;
  136 |           reject = no;
  137 |         });
  138 |         return { promise, resolve, reject };
  139 |       },
  140 |     });
  141 |   globalThis.DOMMatrix ??= class {} as typeof DOMMatrix;
  142 |   const pdfjs = await import('../docs/node_modules/pdfjs-dist/legacy/build/pdf.mjs');
  143 |   const task = pdfjs.getDocument({ data: new Uint8Array(bytes), useSystemFonts: true });
  144 |   const document = await task.promise;
  145 |   try {
  146 |     const pages: string[] = [];
  147 |     for (let index = 1; index <= document.numPages; index++) {
  148 |       const text = await (await document.getPage(index)).getTextContent();
  149 |       pages.push(text.items.map((item) => ('str' in item ? item.str : '')).join('\n'));
  150 |     }
  151 |     return pages;
  152 |   } finally {
  153 |     await task.destroy();
  154 |   }
  155 | }
  156 | test('native Word table repeats leading headers on every actual printed page', async ({
  157 |   page,
  158 |   context,
  159 | }) => {
  160 |   const directory = path.resolve('docs/audits/2026-11-26/word-table-pagination');
  161 |   await mkdir(directory, { recursive: true });
  162 |   const document = new Document({
  163 |     sections: [
  164 |       {
  165 |         children: [
  166 |           new Table({
  167 |             rows: [
  168 |               new TableRow({
  169 |                 tableHeader: true,
  170 |                 children: [
  171 |                   new TableCell({
  172 |                     children: [
  173 |                       new Paragraph({
  174 |                         children: [
  175 |                           new ExternalHyperlink({
  176 |                             link: 'https://example.com/table-heading',
  177 |                             children: [new TextRun('Repeated table heading')],
  178 |                           }),
  179 |                         ],
  180 |                       }),
  181 |                     ],
  182 |                   }),
  183 |                 ],
  184 |               }),
  185 |               ...Array.from(
  186 |                 { length: 65 },
  187 |                 (_, index) =>
  188 |                   new TableRow({
  189 |                     children: [
  190 |                       new TableCell({ children: [new Paragraph(`Table body row ${index + 1}`)] }),
  191 |                     ],
  192 |                   })
  193 |               ),
  194 |             ],
  195 |           }),
  196 |         ],
  197 |       },
  198 |     ],
  199 |   });
  200 |   const source = Buffer.from(await Packer.toArrayBuffer(document));
  201 |   await writeFile(path.join(directory, 'table-source.docx'), source);
  202 |   await page.addInitScript(() => {
  203 |     window.print = () => {
  204 |       window.parent.postMessage(
  205 |         { type: 'table-print', html: document.documentElement.outerHTML },
  206 |         '*'
  207 |       );
  208 |       window.dispatchEvent(new Event('afterprint'));
  209 |     };
  210 |   });
  211 |   await page.goto('/#/components/office-studio');
  212 |   await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
  213 |     name: 'Table-pages.docx',
  214 |     mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  215 |     buffer: source,
  216 |   });
  217 |   await expect(
  218 |     page
```
