# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-word-rows.spec.ts >> multi-cell row fragments keep independent text and aligned page gaps through native reopen
- Location: e2e/office-studio-word-rows.spec.ts:1330:1

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "<w:position w:val=\"12pt\""
Received string:    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><w:document mc:Ignorable=\"w14 w15 wp14\" xmlns:wpc=\"http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas\" xmlns:mc=\"http://schemas.openxmlformats.org/markup-compatibility/2006\" xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" xmlns:m=\"http://schemas.openxmlformats.org/officeDocument/2006/math\" xmlns:v=\"urn:schemas-microsoft-com:vml\" xmlns:wp14=\"http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing\" xmlns:wp=\"http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing\" xmlns:w10=\"urn:schemas-microsoft-com:office:word\" xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\" xmlns:w14=\"http://schemas.microsoft.com/office/word/2010/wordml\" xmlns:w15=\"http://schemas.microsoft.com/office/word/2012/wordml\" xmlns:wpg=\"http://schemas.microsoft.com/office/word/2010/wordprocessingGroup\" xmlns:wpi=\"http://schemas.microsoft.com/office/word/2010/wordprocessingInk\" xmlns:wne=\"http://schemas.microsoft.com/office/word/2006/wordml\" xmlns:wps=\"http://schemas.microsoft.com/office/word/2010/wordprocessingShape\" xmlns:cx=\"http://schemas.microsoft.com/office/drawing/2014/chartex\" xmlns:cx1=\"http://schemas.microsoft.com/office/drawing/2015/9/8/chartex\" xmlns:cx2=\"http://schemas.microsoft.com/office/drawing/2015/10/21/chartex\" xmlns:cx3=\"http://schemas.microsoft.com/office/drawing/2016/5/9/chartex\" xmlns:cx4=\"http://schemas.microsoft.com/office/drawing/2016/5/10/chartex\" xmlns:cx5=\"http://schemas.microsoft.com/office/drawing/2016/5/11/chartex\" xmlns:cx6=\"http://schemas.microsoft.com/office/drawing/2016/5/12/chartex\" xmlns:cx7=\"http://schemas.microsoft.com/office/drawing/2016/5/13/chartex\" xmlns:cx8=\"http://schemas.microsoft.com/office/drawing/2016/5/14/chartex\" xmlns:aink=\"http://schemas.microsoft.com/office/drawing/2016/ink\" xmlns:am3d=\"http://schemas.microsoft.com/office/drawing/2017/model3d\" xmlns:w16cex=\"http://schemas.microsoft.com/office/word/2018/wordml/cex\" xmlns:w16cid=\"http://schemas.microsoft.com/office/word/2016/wordml/cid\" xmlns:w16=\"http://schemas.microsoft.com/office/word/2018/wordml\" xmlns:w16sdtdh=\"http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash\" xmlns:w16se=\"http://schemas.microsoft.com/office/word/2015/wordml/symex\"><w:body><w:tbl><w:tblPr><w:tblW w:type=\"dxa\" w:w=\"9000\"/><w:tblBorders><w:top w:val=\"single\" w:color=\"auto\" w:sz=\"4\"/><w:left w:val=\"single\" w:color=\"auto\" w:sz=\"4\"/><w:bottom w:val=\"single\" w:color=\"auto\" w:sz=\"4\"/><w:right w:val=\"single\" w:color=\"auto\" w:sz=\"4\"/><w:insideH w:val=\"single\" w:color=\"auto\" w:sz=\"4\"/><w:insideV w:val=\"single\" w:color=\"auto\" w:sz=\"4\"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w=\"4500\"/><w:gridCol w:w=\"4500\"/></w:tblGrid><w:tr><w:trPr><w:cantSplit w:val=\"off\"/><w:tblHeader w:val=\"off\"/></w:trPr><w:tc><w:tcPr><w:tcW w:type=\"dxa\" w:w=\"4500\"/><w:gridSpan w:val=\"1\"/></w:tcPr><w:p><w:pPr><w:spacing w:after=\"0\" w:before=\"0\" w:line=\"240\" w:lineRule=\"auto\"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:position w:val=\"24\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 1</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 2</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 3</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 4</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 5</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 6</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 7</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 8</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 9</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 10</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 11</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 12</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 13</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 14</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 15</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 16</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 17</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 18</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 19</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 20</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 21</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 22</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 23</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 24</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 25</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 26</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 27</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 28</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 29</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 30</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 31</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 32</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 33</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 34</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 35</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 36</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 37</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 38</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 39</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 40</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 41</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 42</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 43</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 44</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 45</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 46</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 47</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 48</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 49</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 50</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 51</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 52</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 53</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 54</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 55</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 56</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 57</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 58</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 59</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 60</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 61</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 62</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 63</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 64</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 65</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 66</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 67</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 68</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 69</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 70</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 71</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 72</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 73</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 74</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 75</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 76</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 77</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 78</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 79</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">Cell A 80</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:type=\"dxa\" w:w=\"4500\"/><w:gridSpan w:val=\"1\"/></w:tcPr><w:p><w:pPr><w:spacing w:after=\"0\" w:before=\"0\" w:line=\"240\" w:lineRule=\"auto\"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 1</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 2</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 3</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 4</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 5</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 6</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 7</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 8</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 9</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 10</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 11</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 12</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 13</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 14</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 15</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 16</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 17</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 18</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 19</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 20</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 21</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 22</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 23</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 24</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 25</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 26</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 27</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 28</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 29</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 30</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 31</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 32</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 33</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 34</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 35</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 36</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 37</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 38</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 39</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 40</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 41</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 42</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 43</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 44</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 45</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 46</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 47</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 48</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 49</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Arial\" w:cs=\"Arial\" w:eastAsia=\"Arial\" w:hAnsi=\"Arial\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t xml:space=\"preserve\">Cell B 50 edited</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:sectPr><w:pgSz w:w=\"11906\" w:h=\"16838\" w:orient=\"portrait\"/><w:pgMar w:top=\"1440\" w:right=\"1440\" w:bottom=\"1440\" w:left=\"1440\" w:header=\"708\" w:footer=\"708\" w:gutter=\"0\"/><w:pgNumType/><w:docGrid w:linePitch=\"360\"/></w:sectPr></w:body></w:document>"
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - button "打开文档菜单" [ref=e6] [cursor=pointer]: 菜单
        - link "Z ZUVI" [ref=e7] [cursor=pointer]:
          - /url: "#/"
          - generic [ref=e8]: Z
          - generic [ref=e9]: ZUVI
      - generic [ref=e10]:
        - button "打开文档命令面板" [ref=e11] [cursor=pointer]
        - button "切换浅色" [pressed] [ref=e15] [cursor=pointer]
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
                - button "打开本地文档 Multi-cell.docx" [ref=e57] [cursor=pointer]:
                  - generic [ref=e58]: Multi-cell.docx
              - button "历史版本" [ref=e59] [cursor=pointer]
              - switch "只读预览" [ref=e61] [cursor=pointer]
            - region "Word 文档编辑器" [ref=e65]:
              - generic [ref=e66]:
                - generic "可编辑 · ⌘ / Ctrl S 保存" [ref=e72]:
                  - status "已保存" [ref=e73]
                - textbox "文档名称" [ref=e77]: Multi-cell.docx
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
                      - tab "开始" [selected] [ref=e123] [cursor=pointer]
                      - tab "插入" [ref=e124] [cursor=pointer]
                      - tab "布局" [ref=e125] [cursor=pointer]
                      - tab "引用" [ref=e126] [cursor=pointer]
                      - tab "审阅" [ref=e127] [cursor=pointer]
                      - tab "视图" [ref=e128] [cursor=pointer]
                  - tabpanel "开始" [ref=e129]:
                    - group "剪贴板" [ref=e130]:
                      - generic [ref=e131]:
                        - button "粘贴" [ref=e132] [cursor=pointer]
                        - generic [ref=e138]:
                          - button "剪切" [disabled] [ref=e139]
                          - button "复制" [disabled] [ref=e148]
                    - button "格式刷" [disabled] [ref=e155]
                    - group "历史" [ref=e160]:
                      - generic [ref=e161]:
                        - button "撤销" [ref=e162] [cursor=pointer]
                        - button "重做" [disabled] [ref=e168]
                    - group "字体" [ref=e175]:
                      - generic [ref=e176]:
                        - generic [ref=e177]:
                          - generic [ref=e180]:
                            - combobox "字体" [ref=e181]: Arial
                            - button "展开选项" [ref=e182] [cursor=pointer]
                          - generic [ref=e187]:
                            - combobox "字号" [ref=e188]: "14"
                            - button "展开选项" [ref=e189] [cursor=pointer]
                          - button "增大字号" [ref=e192] [cursor=pointer]
                          - button "减小字号" [ref=e195] [cursor=pointer]
                        - button "字符间距与位置" [ref=e198] [cursor=pointer]
                        - generic [ref=e200]:
                          - button "粗体" [ref=e201] [cursor=pointer]
                          - button "斜体" [ref=e206] [cursor=pointer]
                          - button "下划线" [ref=e210] [cursor=pointer]:
                            - generic [ref=e211]: U
                          - button "删除线" [ref=e213] [cursor=pointer]:
                            - generic [ref=e214]: S
                          - button "上标" [ref=e216] [cursor=pointer]:
                            - generic [ref=e217]:
                              - text: x
                              - superscript [ref=e218]: "2"
                          - button "下标" [ref=e219] [cursor=pointer]:
                            - generic [ref=e220]:
                              - text: x
                              - subscript [ref=e221]: "2"
                          - generic "文字颜色" [ref=e222]:
                            - button "文字颜色" [ref=e223] [cursor=pointer]: A
                          - button "清除格式" [ref=e225] [cursor=pointer]:
                            - generic [aria-hidden] [ref=e227]: A
                          - button "文字高亮" [ref=e229] [cursor=pointer]
                          - button "变更大小写" [ref=e234] [cursor=pointer]
                    - group "段落" [ref=e238]:
                      - generic [ref=e239]:
                        - generic [ref=e240]:
                          - button "项目符号" [ref=e241] [cursor=pointer]:
                            - generic [aria-hidden] [ref=e243]: • ≡
                          - button "编号列表" [ref=e244] [cursor=pointer]:
                            - generic [aria-hidden] [ref=e246]: 1. ≡
                          - button "列表下沉缩进" [disabled] [ref=e247]:
                            - generic [aria-hidden] [ref=e249]: 1.1 →
                          - button "列表上提缩进" [disabled] [ref=e250]:
                            - generic [aria-hidden] [ref=e252]: ← 1.1
                          - button "减少缩进" [disabled] [ref=e253]:
                            - generic [ref=e254]: ← ≡
                          - button "增加缩进" [ref=e255] [cursor=pointer]:
                            - generic [ref=e256]: ≡ →
                          - button "继续编号" [disabled] [ref=e257]
                          - textbox "编号起始值" [disabled] [ref=e260]: "1"
                          - button "重新开始编号" [disabled] [ref=e261]
                          - generic [ref=e263]:
                            - generic [ref=e264]: 编号格式
                            - button "编号格式 1, 2, 3" [disabled] [ref=e265]:
                              - generic [ref=e266]: 1, 2, 3
                          - button "多级编号定义" [ref=e267] [cursor=pointer]
                          - button "段落边框与底纹" [ref=e269] [cursor=pointer]
                          - generic [ref=e271]:
                            - generic [ref=e272]: 段落行距
                            - button "段落行距 1 倍行距" [ref=e273] [cursor=pointer]:
                              - generic [ref=e274]: 1 倍行距
                          - button "段落设置" [ref=e275] [cursor=pointer]
                          - button "制表位" [ref=e277] [cursor=pointer]
                          - button "插入制表符" [ref=e279] [cursor=pointer]
                        - generic [ref=e281]:
                          - button "左对齐" [pressed] [ref=e282] [cursor=pointer]
                          - button "居中" [ref=e285] [cursor=pointer]
                          - button "右对齐" [ref=e288] [cursor=pointer]
                          - button "两端对齐" [ref=e291] [cursor=pointer]
                          - button "显示非打印字符" [ref=e294] [cursor=pointer]:
                            - generic [aria-hidden] [ref=e296]: ¶
                    - group "样式" [ref=e298]:
                      - generic [ref=e299]:
                        - generic [ref=e300]:
                          - button "正文样式" [ref=e301] [cursor=pointer]:
                            - generic [ref=e302]:
                              - generic [aria-hidden] [ref=e303]: AaBbCc
                              - generic [ref=e304]: 正文
                          - button "无间距样式" [pressed] [ref=e305] [cursor=pointer]:
                            - generic [ref=e306]:
                              - generic [aria-hidden] [ref=e307]: AaBbCc
                              - generic [ref=e308]: 无间距
                          - button "标题 1样式" [ref=e309] [cursor=pointer]:
                            - generic [ref=e310]:
                              - generic [aria-hidden] [ref=e311]: AaBbCc
                              - generic [ref=e312]: 标题 1
                        - generic [ref=e313]:
                          - generic [ref=e314]: 段落样式
                          - button "段落样式 无间距" [ref=e315] [cursor=pointer]:
                            - generic [ref=e316]: 无间距
                        - generic [ref=e317]:
                          - button "新建段落样式" [ref=e318] [cursor=pointer]:
                            - generic [ref=e319]: 新建样式
                          - button "修改段落样式" [disabled] [ref=e320]:
                            - generic [ref=e321]: 修改样式
                    - group "编辑" [ref=e323]:
                      - generic [ref=e324]:
                        - button "查找与替换" [ref=e325] [cursor=pointer]:
                          - generic [ref=e330]: 查找
                        - button "文档大纲" [ref=e331] [cursor=pointer]:
                          - generic [ref=e335]: 大纲
                - generic [ref=e337]:
                  - toolbar "Word 文档工具" [ref=e338]:
                    - button "打开查找与替换" [ref=e339] [cursor=pointer]
                    - button "打开文档大纲" [ref=e344] [cursor=pointer]
                    - button "打开字数统计" [ref=e348] [cursor=pointer]
                  - generic [ref=e353]:
                    - generic "段落缩进标尺" [ref=e354]:
                      - generic [aria-hidden] [ref=e356]: "0"
                      - generic [aria-hidden] [ref=e357]: "1"
                      - generic [aria-hidden] [ref=e358]: "2"
                      - generic [aria-hidden] [ref=e359]: "3"
                      - generic [aria-hidden] [ref=e360]: "4"
                      - generic [aria-hidden] [ref=e361]: "5"
                      - generic [aria-hidden] [ref=e362]: "6"
                      - generic [aria-hidden] [ref=e363]: "7"
                      - generic [aria-hidden] [ref=e364]: "8"
                      - generic [aria-hidden] [ref=e365]: "9"
                      - generic [aria-hidden] [ref=e366]: "10"
                      - generic [aria-hidden] [ref=e367]: "11"
                      - generic [aria-hidden] [ref=e368]: "12"
                      - generic [aria-hidden] [ref=e369]: "13"
                      - generic [aria-hidden] [ref=e370]: "14"
                      - generic [aria-hidden] [ref=e371]: "15"
                      - slider "首行缩进标尺" [ref=e372] [cursor=pointer]
                      - slider "悬挂缩进标尺" [ref=e374] [cursor=pointer]
                      - slider "左缩进标尺" [ref=e376] [cursor=pointer]
                      - slider "右缩进标尺" [ref=e378] [cursor=pointer]
                    - generic [ref=e380]:
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
                      - article "文档纸张" [ref=e381]:
                        - region "页眉区域" [ref=e382]
                        - textbox "Word 文档正文" [ref=e384]:
                          - table [ref=e386]:
                            - rowgroup [ref=e390]:
                              - row [ref=e391]:
                                - cell [ref=e392]:
                                  - paragraph [ref=e394]:
                                    - text: Cell A 1Cell A 2Cell A 3Cell A 4Cell A 5Cell A 6Cell A 7Cell A 8Cell A 9Cell A 10Cell A 11Cell A 12Cell A 13Cell A 14Cell A 15Cell A 16Cell A 17Cell A 18Cell A 19Cell A 20Cell A 21Cell A 22Cell A 23Cell A 24Cell A 25Cell A 26Cell A 27Cell A 28Cell A 29Cell A 30Cell A 31Cell A 32Cell A 33Cell A 34Cell A 35Cell A 36Cell A 37Cell A 38Cell A 39Cell A 40Cell A 41Cell A 42Cell A 43Cell A 44Cell A 45Cell A 46Cell A 47Cell A 48Cell A 49Cell A 50Cell A 51Cell A 52
                                    - generic [aria-hidden]: 第 1 页结束
                                    - text: Cell A 53Cell A 54Cell A 55Cell A 56Cell A 57Cell A 58Cell A 59Cell A 60Cell A 61Cell A 62Cell A 63Cell A 64Cell A 65Cell A 66Cell A 67Cell A 68Cell A 69Cell A 70Cell A 71Cell A 72Cell A 73Cell A 74Cell A 75Cell A 76Cell A 77Cell A 78Cell A 79Cell A 80
                                - cell [ref=e395]:
                                  - paragraph [ref=e397]: Cell B 1Cell B 2Cell B 3Cell B 4Cell B 5Cell B 6Cell B 7Cell B 8Cell B 9Cell B 10Cell B 11Cell B 12Cell B 13Cell B 14Cell B 15Cell B 16Cell B 17Cell B 18Cell B 19Cell B 20Cell B 21Cell B 22Cell B 23Cell B 24Cell B 25Cell B 26Cell B 27Cell B 28Cell B 29Cell B 30Cell B 31Cell B 32Cell B 33Cell B 34Cell B 35Cell B 36Cell B 37Cell B 38Cell B 39Cell B 40Cell B 41Cell B 42Cell B 43Cell B 44Cell B 45Cell B 46Cell B 47Cell B 48Cell B 49Cell B 50 edited
                        - region "页脚区域" [ref=e398]
                - generic [ref=e399]:
                  - generic [ref=e400]: 898 字 · A4 · 纵向
                  - generic [ref=e401]:
                    - generic [ref=e402]: 缩放
                    - generic [ref=e403]:
                      - generic [ref=e404]: Word 缩放
                      - button "Word 缩放 适应宽度" [ref=e405] [cursor=pointer]:
                        - generic [ref=e406]: 适应宽度
            - paragraph [ref=e407]: 文件保存在当前浏览器的本地文档空间。需要长期留存时，请导出文件。
          - group [ref=e408]:
            - generic "示例代码" [ref=e409] [cursor=pointer]:
              - generic [aria-hidden] [ref=e410]: </>
              - text: 示例代码
              - generic [aria-hidden] [ref=e411]: 展开 / 收起
        - heading "编辑能力" [level=2] [ref=e412]
        - table [ref=e414]:
          - rowgroup [ref=e415]:
            - row [ref=e416]:
              - columnheader "文档" [ref=e417]
              - columnheader "支持的操作" [ref=e418]
              - columnheader "当前范围" [ref=e419]
          - rowgroup [ref=e420]:
            - row [ref=e421]:
              - cell "Word" [ref=e422]
              - cell "字体与小数字号输入、正文排版、列表、表格、图片、页眉页脚、页码、查找替换、页面设置、撤销重做；导入与导出 DOCX" [ref=e423]
              - cell "支持内嵌图片与单节文档。修订、目录、浮动对象等复杂结构会提示暂不支持。" [ref=e424]
            - row [ref=e425]:
              - cell "Excel" [ref=e426]
              - cell "单元格与矩形选区、字体与小数字号输入、手动与自动行高/列宽、查找替换、边框与垂直对齐、清除格式、公式和跨表引用、格式、复制粘贴、工作表增删、行列插入删除、合并、冻结、排序、筛选、柱状图与折线图；导入与导出 XLSX" [ref=e427]
              - cell "10,000 行、256 列、32 张表、100,000 个已使用单元格。透视、宏、数组公式及复杂图表暂不支持。" [ref=e428]
            - row [ref=e429]:
              - cell "PDF" [ref=e430]
              - cell "分页与缩略图、缩放、旋转、全文查找、文字与高亮、矩形和手写批注、已有表单、撤销重做；导出 PDF" [ref=e431]
              - cell "批注和表单编辑。任意原始文字修改、原文重排及扫描件 OCR 暂不支持。" [ref=e432]
        - heading "组件接入" [level=2] [ref=e433]
        - paragraph [ref=e434]: UI 组件使用 Tiptap / ProseMirror 和公式计算库；文件适配使用 docx、ExcelJS、pdf-lib 与 PDF.js。本页无需文档服务器。宿主可以替换保存与导入导出回调，接入自己的文件系统。
        - paragraph [ref=e435]:
          - text: PDF 的 worker、字体与渲染由
          - code [ref=e436]: pdfRenderer
          - text: 提供。本页的适配代码位于
          - code [ref=e437]: docs/src/pages/collaboration/office-studio/
          - text: 。组件自 v0.4.0 起随
          - code [ref=e438]: "@zuvi/react"
          - text: 和 Registry 发布。
        - region "组件属性表，可横向滚动" [ref=e439]:
          - table [ref=e440]:
            - rowgroup [ref=e441]:
              - row [ref=e442]:
                - columnheader "属性名" [ref=e443]
                - columnheader "类型" [ref=e444]
                - columnheader "默认值" [ref=e445]
                - columnheader "说明" [ref=e446]
            - rowgroup [ref=e447]:
              - row [ref=e448]:
                - cell "value / defaultValue" [ref=e449]
                - cell [ref=e450]:
                  - code [ref=e451]: OfficeStudioDocument
                - cell [ref=e452]:
                  - code [ref=e453]: —
                - cell "受控文档或非受控初始文档；支持 Word、Excel、PDF 三种模型。" [ref=e454]
              - row [ref=e455]:
                - cell "onChange" [ref=e456]
                - cell [ref=e457]:
                  - code [ref=e458]: (document) => void
                - cell [ref=e459]:
                  - code [ref=e460]: —
                - cell "内容或文件名称变化。" [ref=e461]
              - row [ref=e462]:
                - cell "source / pdfRenderer" [ref=e463]
                - cell [ref=e464]:
                  - code [ref=e465]: Blob / StudioPdfRenderer
                - cell [ref=e466]:
                  - code [ref=e467]: —
                - cell "原始文件及 PDF 渲染适配；worker 资源由宿主管理。" [ref=e468]
              - row [ref=e469]:
                - cell "onSave / onExport / onPrint" [ref=e470]
                - cell [ref=e471]:
                  - code [ref=e472]: (document) => void | Promise<void>
                - cell [ref=e473]:
                  - code [ref=e474]: —
                - cell "宿主处理保存、导出或打印；返回后更新状态，失败可重试。" [ref=e475]
              - row [ref=e476]:
                - cell "onImport / onCreate" [ref=e477]
                - cell [ref=e478]:
                  - code [ref=e479]: (file | kind) => void | Promise<void>
                - cell [ref=e480]:
                  - code [ref=e481]: —
                - cell "宿主解析文件或创建模型，并更新受控值。" [ref=e482]
              - row [ref=e483]:
                - cell "readOnly / disabled" [ref=e484]
                - cell [ref=e485]:
                  - code [ref=e486]: boolean
                - cell [ref=e487]:
                  - code [ref=e488]: "false"
                - cell "只读预览或禁用编辑与文件操作。" [ref=e489]
              - row [ref=e490]:
                - cell "saveState" [ref=e491]
                - cell [ref=e492]:
                  - code [ref=e493]: "'saved' | 'saving' | 'unsaved' | 'error'"
                - cell [ref=e494]:
                  - code [ref=e495]: —
                - cell "宿主自动保存状态。" [ref=e496]
              - row [ref=e497]:
                - cell "height" [ref=e498]
                - cell [ref=e499]:
                  - code [ref=e500]: number | string
                - cell [ref=e501]:
                  - code [ref=e502]: "760"
                - cell "编辑器高度；100% 需要父容器设置确定高度。" [ref=e503]
              - row [ref=e504]:
                - cell "fullscreen / onFullscreenChange" [ref=e505]
                - cell [ref=e506]:
                  - code [ref=e507]: boolean / (value) => void
                - cell [ref=e508]:
                  - code [ref=e509]: —
                - cell "全屏布局，切换时编辑内容保持挂载。" [ref=e510]
              - row [ref=e511]:
                - cell "ref" [ref=e512]
                - cell [ref=e513]:
                  - code [ref=e514]: OfficeStudioHandle
                - cell [ref=e515]:
                  - code [ref=e516]: —
                - cell "getDocument()、save()、export()、print()、setFullscreen()。" [ref=e517]
              - row [ref=e518]:
                - cell "classNames" [ref=e519]
                - cell [ref=e520]:
                  - code [ref=e521]: "{ root?; header?; title?; actions?; stage?; status?; error? }"
                - cell [ref=e522]:
                  - code [ref=e523]: —
                - cell "追加语义结构类名，配合 data-part 与 CSS 变量定制。" [ref=e524]
  - text: ✓ ✓ ✓ ✓ ✓
```

# Test source

```ts
  1394 |   await expect(body).toContainText('Cell A 80');
  1395 |   await expect(body).toContainText('Cell B 50');
  1396 |   const enablePagination = async () => {
  1397 |     await page.getByRole('tab', { name: '视图', exact: true }).click();
  1398 |     const toggle = page.getByRole('checkbox', { name: '分页布局', exact: true });
  1399 |     if (!(await toggle.isChecked())) await toggle.click();
  1400 |     await expect(body).toHaveAttribute('data-word-pagination-overflow', 'false');
  1401 |     await expect(body.locator('td').nth(0).locator('[data-word-cell-page-gap]')).not.toHaveCount(0);
  1402 |     await expect(body.locator('td').nth(1).locator('[data-word-cell-page-gap]')).not.toHaveCount(0);
  1403 |   };
  1404 |   await enablePagination();
  1405 |   const naturalHeight = Number(
  1406 |     await body.locator('tr').getAttribute('data-word-natural-row-height')
  1407 |   );
  1408 |   expect(naturalHeight).toBeGreaterThan(0);
  1409 |   expect((await body.locator('tr').boundingBox())!.height).toBeGreaterThan(naturalHeight);
  1410 |   const gaps = await body.evaluate((element) => {
  1411 |     const scale = element.getBoundingClientRect().width / (element as HTMLElement).offsetWidth;
  1412 |     return Array.from(element.querySelectorAll('td')).map((cell) => {
  1413 |       const gap = cell.querySelector('[data-word-cell-page-gap]')!;
  1414 |       const rect = gap.getBoundingClientRect();
  1415 |       return {
  1416 |         top: rect.top,
  1417 |         end:
  1418 |           rect.top + parseFloat(getComputedStyle(gap).getPropertyValue('--word-gap-start')) * scale,
  1419 |       };
  1420 |     });
  1421 |   });
  1422 |   expect(Math.abs(gaps[0].end - gaps[1].end)).toBeLessThan(2);
  1423 |   const row = body.locator('tr');
  1424 |   await row.evaluate((element) => element.scrollIntoView({ block: 'end' }));
  1425 |   const boundary = (await row.boundingBox())!;
  1426 |   const dragScale = await body.evaluate(
  1427 |     (element) => element.getBoundingClientRect().width / (element as HTMLElement).offsetWidth
  1428 |   );
  1429 |   const pointerStart = Math.round(boundary.y + boundary.height - 1);
  1430 |   const pointerEnd = pointerStart + Math.round(16 * dragScale);
  1431 |   await page.mouse.move(boundary.x + 20, pointerStart);
  1432 |   await page.mouse.down();
  1433 |   await page.mouse.move(boundary.x + 20, pointerEnd, { steps: 4 });
  1434 |   const guide = page.locator('[data-word-row-resize-guide]');
  1435 |   await expect(guide).toBeVisible();
  1436 |   expect(parseFloat((await guide.textContent())!)).toBe(
  1437 |     Math.round((naturalHeight * 0.75 + ((pointerEnd - pointerStart) / dragScale) * 0.75) * 2) / 2
  1438 |   );
  1439 |   await page.keyboard.press('Escape');
  1440 |   await page.mouse.up();
  1441 |   await expect(guide).toHaveCount(0);
  1442 |   await expect(row).not.toHaveAttribute('data-word-row-height');
  1443 |   const target = body.locator('td').nth(1).locator('p').first();
  1444 |   await target.evaluate((element) => {
  1445 |     (element.closest('[contenteditable]') as HTMLElement).focus();
  1446 |     const range = document.createRange();
  1447 |     range.selectNodeContents(element);
  1448 |     range.collapse(false);
  1449 |     window.getSelection()!.removeAllRanges();
  1450 |     window.getSelection()!.addRange(range);
  1451 |     document.dispatchEvent(new Event('selectionchange'));
  1452 |   });
  1453 |   await expect
  1454 |     .poll(() =>
  1455 |       body.evaluate((element) => {
  1456 |         const editor = (
  1457 |           element as HTMLElement & { editor: { state: { selection: { empty: boolean } } } }
  1458 |         ).editor;
  1459 |         return editor.state.selection.empty;
  1460 |       })
  1461 |     )
  1462 |     .toBe(true);
  1463 |   await body.pressSequentially(' edited');
  1464 |   await expect(target).toContainText('Cell B 50 edited');
  1465 |   await expect(body).toContainText('Cell A 80');
  1466 |   await page.getByRole('tab', { name: '开始', exact: true }).click();
  1467 |   await page.getByRole('button', { name: '撤销', exact: true }).click();
  1468 |   await expect(target).not.toContainText(' edited');
  1469 |   await expect(body).toContainText('Cell B 50');
  1470 |   await page.getByRole('button', { name: '重做', exact: true }).click();
  1471 |   await expect(target).toContainText('Cell B 50 edited');
  1472 |   await body.locator('[data-word-cell-page-gap]').first().scrollIntoViewIfNeeded();
  1473 |   await page.screenshot({ path: path.join(directory, 'multi-cell-light.png'), fullPage: true });
  1474 |   await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  1475 |   await page.setViewportSize({ width: 320, height: 720 });
  1476 |   await body.locator('[data-word-cell-page-gap]').first().scrollIntoViewIfNeeded();
  1477 |   await page.screenshot({ path: path.join(directory, 'multi-cell-dark-320.png'), fullPage: true });
  1478 |   await page.setViewportSize({ width: 1280, height: 900 });
  1479 |   await body.locator('[data-word-cell-page-gap]').first().scrollIntoViewIfNeeded();
  1480 |   await page.screenshot({ path: path.join(directory, 'multi-cell-dark.png'), fullPage: true });
  1481 |   await page.getByRole('button', { name: '切换浅色', exact: true }).click();
  1482 |   await page.setViewportSize({ width: 320, height: 720 });
  1483 |   await body.locator('[data-word-cell-page-gap]').first().scrollIntoViewIfNeeded();
  1484 |   await page.screenshot({ path: path.join(directory, 'multi-cell-light-320.png'), fullPage: true });
  1485 |   expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(321);
  1486 |   await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  1487 |   for (let pass = 1; pass <= 2; pass++) {
  1488 |     const download = page.waitForEvent('download');
  1489 |     await page.getByRole('button', { name: '导出文件', exact: true }).click();
  1490 |     const bytes = await readFile((await (await download).path())!);
  1491 |     await writeFile(path.join(directory, `multi-cell-roundtrip-${pass}.docx`), bytes);
  1492 |     const xml = await (await JSZip.loadAsync(bytes)).file('word/document.xml')!.async('string');
  1493 |     expect(xml).toContain('Cell A 80');
> 1494 |     expect(xml).toContain('<w:position w:val="12pt"');
       |                 ^ Error: expect(received).toContain(expected) // indexOf
  1495 |     expect(xml).toContain('Cell B 50 edited');
  1496 |     expect(xml).not.toContain('data-word-cell-page-gap');
  1497 |     expect(xml).not.toContain('data-word-natural-row-height');
  1498 |     await importFile(`Multi-cell-${pass}.docx`, bytes);
  1499 |     await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
  1500 |       `Multi-cell-${pass}.docx`
  1501 |     );
  1502 |     await expect(body).toContainText('Cell A 80');
  1503 |     await enablePagination();
  1504 |     await expect(body).toContainText('Cell B 50 edited');
  1505 |   }
  1506 |   await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  1507 |   const readonlyText = await body.textContent();
  1508 |   await body.pressSequentially('blocked');
  1509 |   expect(await body.textContent()).toBe(readonlyText);
  1510 |   await page.evaluate(() =>
  1511 |     window.addEventListener('message', (event) => {
  1512 |       if (event.data?.type === 'multi-cell-print')
  1513 |         (window as Window & { multiCellPrint?: string }).multiCellPrint = event.data.html;
  1514 |     })
  1515 |   );
  1516 |   await page.getByRole('button', { name: '打印', exact: true }).click();
  1517 |   await expect
  1518 |     .poll(() =>
  1519 |       page.evaluate(() => (window as Window & { multiCellPrint?: string }).multiCellPrint)
  1520 |     )
  1521 |     .toBeTruthy();
  1522 |   const preview = await context.newPage();
  1523 |   await preview.setContent(
  1524 |     await page.evaluate(() => (window as Window & { multiCellPrint?: string }).multiCellPrint!)
  1525 |   );
  1526 |   await preview.evaluate(() => document.fonts.ready);
  1527 |   await expect(preview.locator('body')).toContainText('Cell A 80');
  1528 |   await expect(preview.locator('body')).toContainText('Cell B 50 edited');
  1529 |   const pdf = await preview.pdf({
  1530 |     path: path.join(directory, 'multi-cell-print.pdf'),
  1531 |     preferCSSPageSize: true,
  1532 |     printBackground: true,
  1533 |   });
  1534 |   const printedPages = (await PDFDocument.load(pdf)).getPageCount();
  1535 |   const editorPages = Number(await body.getAttribute('data-word-page-count'));
  1536 |   expect(printedPages).toBe(editorPages);
  1537 |   expect(printedPages).toBeGreaterThan(1);
  1538 |   await writeFile(
  1539 |     path.join(directory, 'multi-cell-evidence.json'),
  1540 |     JSON.stringify({ gaps, editorPages, printedPages }, null, 2)
  1541 |   );
  1542 |   await preview.close();
  1543 | });
  1544 | 
```