import { Editor, TinyMCE } from 'tinymce';

declare const tinymce: TinyMCE;

class AutoComplete {
  private editor: Editor;
  private id: string;
  private dropdown: HTMLElement;

  private keydownProxy: any;
  private keyupProxy: any;
  private blurProxy: any;

  private searchKey: string;

  constructor(editor) {
    this.editor = editor;
    this.id = this.generateID();


    this.renderContainer();
    this.bindEvents();
  }

  getId() {
    return this.id;
  }

  bindEvents() {
    if (this.editor) {
      this.editor.on('keydown', this.keydownProxy = this.handleKeydown.bind(this), true);
      this.editor.on('keyup', this.keyupProxy = this.handleKeyup.bind(this));
      this.editor.on('blur', this.blurProxy = this.clear.bind(this, true));
    }
  }

  unbindEvents() {
    if (this.editor) {
      this.editor.off('keydown', this.keydownProxy);
      this.editor.off('keyup', this.keyupProxy);
      this.editor.off('blur', this.blurProxy);
    }
  }

  generateID(length = 10) {
		let result = ''
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
		const charactersLength = characters.length
		for(let i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength))
		}
		return result
	}

  calcCurrentPosition(range, filterList) {
    const container = this.editor.editorContainer;
    const containerRect = container.getBoundingClientRect();
    const rangeRect = range.getBoundingClientRect();
    
    // 默认 bottom right
    let top = containerRect.y + rangeRect.y + 20;
    let left = containerRect.x + rangeRect.x;
    
    const maxWidth = document.body.clientWidth;
    const maxHeight = document.body.clientHeight;

    const domWidth = 200;
    const domHeight = 40 * filterList.length + 16 > 230 ? 230 : 40 * filterList.length + 16;

    const topCanContain = top + domHeight < maxHeight;
    const leftCanContain = left + domWidth < maxWidth;

    if (!topCanContain) {
      top = top - domHeight - 20;
    }
    if (!leftCanContain) {
      left = left - domWidth;
    }
    return { top, left };
  }

  show(filterList, sel, range) {
    const editor = this.editor;
    if (editor && sel && range) {
      // 计算dropdown位置
      const { top, left } = this.calcCurrentPosition(range, filterList);
      if (this.dropdown) {
        this.dropdown.setAttribute('style', `top: ${top}px; left: ${left}px`);
        const ul = document.createElement('ul');
        ul.classList.add('oa-tinymce-mentions-list');
        ul.setAttribute('size', filterList.length);

        if (filterList && filterList.length) {
          filterList.forEach((i, idx) => {
            const li = document.createElement('li');
            li.setAttribute('idx', idx);
            li.setAttribute('id', i.userId);
            li.setAttribute('xuid', i.xuid);
            li.setAttribute('name', i.name);
            li.classList.add('oa-tinymce-mentions-item');
            if (idx === 0) {
              li.classList.add('oa-tinymce-mentions-item-active');
            }
            li.addEventListener('mousedown', () => this.selectActiveItem(li));
            li.innerText = `${i.name} - ${i.department}`;
            ul.appendChild(li);
          });
        } else {
          const li = document.createElement('li');
          li.setAttribute('idx', '0');
          li.classList.add('oa-tinymce-mentions-item', '_disabled');
          li.innerText = '暂无结果';
          ul.appendChild(li);
        }

        this.dropdown.innerHTML = '';
        this.dropdown.appendChild(ul);
      } else {
        const dropdown = document.createElement('div');
        dropdown.setAttribute('contenteditable', 'false');
        dropdown.setAttribute('style', `top: ${top}px; left: ${left}px`);
        dropdown.classList.add('oa-tinymce-mentions-container');

        const ul = document.createElement('ul');
        ul.classList.add('oa-tinymce-mentions-list');
        ul.setAttribute('size', filterList.length);

        if (filterList && filterList.length) {
          filterList.forEach((i, idx) => {
            const li = document.createElement('li');
            li.setAttribute('idx', idx);
            li.setAttribute('id', i.userId);
            li.setAttribute('xuid', i.xuid);
            li.setAttribute('name', i.name);
            li.classList.add('oa-tinymce-mentions-item');
            if (idx === 0) {
              li.classList.add('oa-tinymce-mentions-item-active');
            }
            li.addEventListener('mousedown', () => this.selectActiveItem(li));
            li.innerText = `${i.name} - ${i.department}`;
            ul.appendChild(li);
          });
        } else {
          const li = document.createElement('li');
          li.setAttribute('idx', '0');
          li.classList.add('oa-tinymce-mentions-item', '_disabled');
          li.innerText = '暂无结果';
          ul.appendChild(li);
        }
        
        dropdown.appendChild(ul);
        this.dropdown = dropdown;
        document.body.appendChild(dropdown);
      }
    }
  }

  clear(async = false) {
    if (async) {
      Promise.resolve().then(() => {
        this.unbindEvents();
        this.hide();
      });
    } else {
      this.unbindEvents();
      this.hide();
    }
    
  }

  hide() {
    if (this.dropdown) {
      document.body.removeChild(this.dropdown);
      this.dropdown = null;
    }
  }


  highlightPrevitem() {
    const ul = this.dropdown.querySelector('ul.oa-tinymce-mentions-list');
    const active = this.dropdown.querySelector('li.oa-tinymce-mentions-item-active');
    let child;
    if (active) {
      (active as HTMLElement).classList.remove('oa-tinymce-mentions-item-active');
      const cur = Number(active.getAttribute('idx'));
      const size = Number(ul.getAttribute('size'));
      child = ul.childNodes[cur - 1 < 0 ? size - 1 : cur - 1];
    } else {
      child = this.dropdown.querySelector('li.oa-tinymce-mentions-item');
    }
    if (child) {
      child.classList.add('oa-tinymce-mentions-item-active');
    }
  }
  highlightNextItem() {
    const ul = this.dropdown.querySelector('ul.oa-tinymce-mentions-list');
    const active = this.dropdown.querySelector('li.oa-tinymce-mentions-item-active');
    let child;
    if (active) {
      (active as HTMLElement).classList.remove('oa-tinymce-mentions-item-active');
      const cur = Number(active.getAttribute('idx'));
      const size = Number(ul.getAttribute('size'));
      child = ul.childNodes[cur + 1 > size - 1 ? 0 : cur + 1];
    } else {
      child = this.dropdown.querySelector('li.oa-tinymce-mentions-item');
    }
    if (child) {
      child.classList.add('oa-tinymce-mentions-item-active');
    }
  }

  handleKeydown(e) {
    switch(e.key) {
      case 'Enter':
      case 'Escape':
        e.preventDefault();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.highlightPrevitem();
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.highlightNextItem();
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
        e.preventDefault();
        break;    
    }
    e.stopPropagation();
  }
  handleKeyup(e) {
    switch(e.key) {
      case 'Shift':
      case 'Control':
      case 'Alt':
      case 'ArrowUp':
      case 'ArrowDown':
        e.preventDefault();
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
        e.preventDefault();
        this.handleArrow();
        break;    
      case 'Enter':
        // eslint-disable-next-line no-case-declarations
        const active = this.dropdown.querySelector('li.oa-tinymce-mentions-item-active');
        if (active) {
          this.selectActiveItem(active);
        } else {
          this.clear();
        }
        break;
      case 'Backspace':
        if (this.searchKey) {
          this.lookup();
        } else {
          const container = this.editor.dom.select('span#oa-tiny-search-'+this.id)[0];
          this.editor.dom.remove(container);
          this.clear();
        }
        break;  
      case 'Escape':
        this.clear();
        break;
      default:
        this.lookup();
        break;
    }
  }

  handleArrow() {
    const container = this.editor.dom.select('span#oa-tiny-search-'+this.id)[0];

    this.editor.dom.remove(container);
    const text = this.getDomValue(container).replace('\ufeff', '');
    this.editor.execCommand('mceInsertContent', false, text);
    this.clear();
  }

  getDomValue(el) {
    let res = ''
    Array.from(el.childNodes).forEach((child: any) => {
      if (child.nodeName === '#text') {
        res += child.nodeValue
      } else if (child.nodeName === 'SPAN') {
        res += this.getDomValue(child)
      }
    })
    return res
  }

  lookup() {
    const range = this.editor.selection.getRng();
    const text = range.startContainer.textContent || '';

    const preCaretRange = range.cloneRange() // 克隆一个选中区域
    preCaretRange.selectNodeContents(this.editor.selection.getSel().anchorNode) // 设置选中区域的节点内容为当前节点
    preCaretRange.setEnd(range.endContainer, range.endOffset)  // 重置选中区域的结束位置
    const tempElem = preCaretRange.cloneContents()
    const end = tempElem.textContent.length; // 到光标的位置

    const content = text.slice(0, end);
    const lastAtIndex = content.lastIndexOf('@')
    const targetText = content.slice(lastAtIndex + 1).replace('\ufeff', '');
    this.searchKey = targetText;
    const regx = /[^\u4e00-\u9fa5\w-]/;
    if(/^\s/.test(targetText) || targetText.match(regx)) {
      // 以空白符开头 或者包含不合法字符
      this.hide();
    } else {
      // 合法的用户输入
      const { mentionsList, mentionsFilterOption } = this.editor.getParam('mentionsOption');
      const filterList = mentionsList.filter((i) => {
        if (mentionsFilterOption) {
          return mentionsFilterOption(targetText, i);
        } else {
          return i.value.includes(targetText);
        }
      })
      if (targetText) { // TODO 搜索类型
        this.show(filterList, this.editor.selection.getSel(), range);
      } else {
        this.hide();
      }
    }
  }

  selectActiveItem(active) {
    const editor = this.editor
    if (active && editor) {
      const id = active.getAttribute('id');
      const name = active.getAttribute('name');
      const xuid = active.getAttribute('xuid');
      const container = this.editor.dom.select('span#oa-tiny-search-'+this.id)[0];
      this.editor.dom.remove(container);
      const html = `<span data-remind="${id}-${name}-${xuid}" contenteditable="false" style="color: #2f68b4;outline: none !important;cursor: default !important;">&nbsp;@${name}&nbsp;</span>`
      editor.execCommand('mceInsertContent', false, html);
      this.clear();
    }
  }

  renderContainer() {
    let rawContainer = '<span class="oa-tiny-search" id="oa-tiny-search-'+this.id+'">'
    // rawContainer += '<span class="oa-tiny-delimeter">'
    // rawContainer += '@'
    // rawContainer += '</span>'
    rawContainer += '<span class="oa-tiny-text">'
    rawContainer += '\ufeff'
    rawContainer += '</span>';
    this.editor.execCommand('mceInsertContent', false, rawContainer);
		this.editor.focus();
  }
}

const setup = (editor: Editor): void => {
  let autocomplete;
  editor.on('keydown', (e) => {
    // 兼容中文@输入相应
    if (e.key === '@' || (e.key === 'Process' && e.shiftKey && e.code === 'Digit2')) {
      // e.preventDefault();
      if (autocomplete) {
        const container = editor.dom.select('span#oa-tiny-search-'+autocomplete.getId())[0];
        if (container) {
          const text = autocomplete.getDomValue(container).replace('\ufeff', '');
          editor.dom.remove(container);
          editor.execCommand('mceInsertContent', false, text);
        }
      }
      autocomplete = new AutoComplete(editor);
    }
  });
};

(function init() {
  tinymce.PluginManager.add('mentions', setup);
}());

