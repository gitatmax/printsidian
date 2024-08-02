import { App, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface PrintPluginSettings {
  printOption: boolean;
}

const DEFAULT_SETTINGS: PrintPluginSettings = {
  printOption: true
}

export default class PrintPlugin extends Plugin {
  settings!: PrintPluginSettings;

  async onload() {

    await this.loadSettings();

    this.addCommand({
      id: 'print-note',
      name: 'Print note',
      callback: () => this.printCurrentNote(),
    });

    this.addSettingTab(new PrintSettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  printCurrentNote() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      const content = activeView.getViewData();
      const title = activeView.file?.basename ?? 'Untitled';

      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '100%';
      printFrame.style.height = '100%';
      printFrame.style.border = 'none';
      document.body.appendChild(printFrame);

      const frameWindow = printFrame.contentWindow;
      if (frameWindow) {
        frameWindow.document.open();
        const htmlContent = `
          <html>
            <head>
              <title>Print note: ${title}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                pre { background-color: #f4f4f4; padding: 1em; border-radius: 4px; }
                code { font-family: 'Courier New', Courier, monospace; }
                .internal-link, a.internal-link { color: #0000EE !important; text-decoration: none; }
                #note-title {
                  text-align: center;
                  margin-top: 0;
                  padding: 20px;
                  background-color: #f0f0f0;
                  border-bottom: 1px solid #ccc;
                  font-size: 24px;
                  page-break-before: avoid;
                  page-break-after: avoid;
                }
                @media print {
                  #note-title {
                    position: running(header);
                  }
                  @page {
                    @top-center {
                      content: element(header);
                    }
                  }
                }
              </style>
              <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
              <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
              <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML"></script>
              <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/default.min.css">
            </head>
            <body>
              <h1 id="note-title">${title}</h1>
              <div id="content"></div>
              <script>
                document.getElementById('note-title').textContent = '${title}';

                marked.setOptions({
                  highlight: function(code, lang) {
                    return hljs.highlightAuto(code, [lang]).value;
                  },
                  breaks: true,
                  gfm: true
                });

                const renderer = new marked.Renderer();
                renderer.link = function(href, title, text) {
                  const isInternal = href.startsWith('[[') && href.endsWith(']]');
                  if (isInternal) {
                    const linkText = href.slice(2, -2);
                    return '<a class="internal-link" href="#">' + linkText + '</a>';
                  }
                  return '<a href="' + href + '"' + (title ? ' title="' + title + '"' : '') + '>' + text + '</a>';
                };

                document.getElementById('content').innerHTML = marked.parse(${JSON.stringify(content)}, { renderer: renderer });

                MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
                hljs.highlightAll();

                window.onload = () => {
                  window.print();
                  window.onafterprint = () => {
                    window.parent.document.body.removeChild(window.frameElement);
                  };
                };
              </script>
            </body>
          </html>
        `;
        frameWindow.document.write(htmlContent);
        frameWindow.document.close();
      } else {
        console.error('Failed to access iframe content window');
      }
    } else {
      console.error('No active view found');
    }
  }
}