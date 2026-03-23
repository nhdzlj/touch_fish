import './style.css'

/**
 * IndexedDB Wrapper
 */
const DB_NAME = 'ToughFishDB_v3';
const STORE_NAME = 'books';
const dbPromise = new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    }
  };
  request.onsuccess = (e) => resolve(e.target.result);
  request.onerror = (e) => reject(e.target.error);
});

async function saveBookToDB(book) {
  const db = await dbPromise;
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(book).onsuccess = () => resolve();
  });
}

async function getBookFromDB(id) {
  const db = await dbPromise;
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    store.get(id).onsuccess = (e) => resolve(e.target.result);
  });
}

async function getAllBooksMetadata() {
  const db = await dbPromise;
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    store.getAll().onsuccess = (e) => {
      resolve(e.target.result.map(b => ({
        id: b.id,
        title: b.title,
        currentIdx: b.currentIdx,
        isChapterMode: b.isChapterMode,
        chapterCount: b.chapters ? b.chapters.length : 0,
        contentLength: b.content.length,
        pageSize: b.pageSize
      })));
    };
  });
}

async function deleteBookFromDB(id) {
  const db = await dbPromise;
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(id).onsuccess = () => resolve();
  });
}

// State
let state = {
  booksMetadata: [],
  currentBookId: null,
  activeBook: null,
  isReaderMode: false
};

// DOM helper
const $ = (id) => document.getElementById(id);

// Init
init();

async function init() {
  await loadState();
  setupEventListeners();
  render();
}

function setupEventListeners() {
  const input = $('novelInput');
  if (input) input.addEventListener('change', handleFileUpload);
  
  const pBtn = $('prevBtn');
  if (pBtn) pBtn.addEventListener('click', () => changeNav(-1));
  
  const nBtn = $('nextBtn');
  if (nBtn) nBtn.addEventListener('click', () => changeNav(1));
  
  const mBtn = $('modeSwitchBtn');
  if (mBtn) mBtn.addEventListener('click', toggleMode);

  window.addEventListener('keydown', (e) => {
    const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
    if (isInput && e.target.id !== 'app') return;

    if (e.key === 'ArrowLeft') {
      changeNav(-1);
    } else if (e.key === 'ArrowRight') {
      changeNav(1);
    } else if (e.code === 'Space') {
      e.preventDefault();
      toggleMode();
    }
  });
}

function toggleMode() {
  state.isReaderMode = !state.isReaderMode;
  document.body.className = state.isReaderMode ? 'mode-reader' : 'mode-blog';
  const text = $('modeStatusText');
  if (text) text.innerText = state.isReaderMode ? '阅读模式' : '博客模式';
  render();
}

async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const text = await readFile(file);
  const id = Date.now().toString();
  const title = file.name.replace('.txt', '');
  
  const newBook = processNovelContent(id, title, text);
  await saveBookToDB(newBook);
  
  state.booksMetadata = await getAllBooksMetadata();
  state.currentBookId = id;
  state.activeBook = newBook;
  
  state.isReaderMode = true;
  document.body.className = 'mode-reader';
  const statusTxt = $('modeStatusText');
  if (statusTxt) statusTxt.innerText = '阅读模式';

  saveStateToLocalStorage();
  render();
}

function readFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsText(file, 'UTF-8');
  });
}

function processNovelContent(id, title, text) {
  const chapterRegex = /\n\s*(第.{1,7}章|第.{1,7}节|第.{1,7}回|Chapter\s*\d+)/gi;
  const positions = [];
  let match;
  while ((match = chapterRegex.exec(text)) !== null) {
    positions.push({ title: match[1].trim(), start: match.index });
  }

  const isChapterMode = positions.length > 5;
  let chapters = [];
  if (isChapterMode) {
    chapters = positions.map((p, i) => {
      const end = positions[i + 1] ? positions[i + 1].start : text.length;
      return { title: p.title, content: text.substring(p.start, end) };
    });
  }

  return { id, title, content: text, chapters, currentIdx: 0, isChapterMode, pageSize: 2000 };
}

async function render() {
  renderBookshelf();
  
  const elTitle = $('articleTitle');
  const elBody = $('articleBody');
  const elProgText = $('progressText');
  const elProgFill = $('progressFill');

  if (!state.isReaderMode) {
    // FAKE BLOG MODE CONTENT
    if (elTitle) elTitle.innerText = 'Spring Boot 核心原理解析：深入浅出 IoC 与 AOP';
    if (elBody) {
      elBody.innerHTML = `
        <div style="color: #222226; font-family: sans-serif;">
          <h3>1. IoC (Inversion of Control) 控制反转</h3>
          <p>IoC 是一种设计思想，指将对象的创建权交给 Spring 容器。在传统的开发模式中，我们需要通过 <code>new</code> 关键字来创建对象，而 Spring 管理这些对象的生命周期。</p>
          <p><strong>核心实现：</strong>通过 BeanDefinitionRegistry 注册 Bean 信息，并在容器启动时由 BeanFactory 进行统一实例化。</p>
          
          <h3>2. AOP (Aspect Oriented Programming) 面向切面编程</h3>
          <p>AOP 允许我们将通用的功能（如日志、事务、安全）从核心业务逻辑中剥离出来。它通过动态代理（JDK Proxy 或 CGLIB）在运行时将增强逻辑编织进目标对象中。</p>
          <pre style="background: #f8f8fa; padding: 15px; border-radius: 4px; font-family: monospace; border: 1px solid #eee;">
@Aspect
@Component
public class LoggingAspect {
    @Before("execution(* com.example.service.*.*(..))")
    public void logBefore() {
        System.out.println("Method is called.");
    }
}</pre>
          <h3>3. Spring Boot 的优势</h3>
          <p>Spring Boot 通过起步依赖（Starters）和自动配置（Auto-Configuration）机制极大地简化了 Maven 配置和 Spring XML 配置，使得开发者能更专注于业务逻辑的实现。</p>
          <p>借助于 <code>@SpringBootApplication</code> 注解，Spring Boot 可以自动扫描项目路径下的组件并完成上下文初始化...</p>
        </div>
      `;
    }
    if (elProgText) elProgText.innerText = '完成度: 75%';
    if (elProgFill) elProgFill.style.width = '75%';
    return;
  }

  // NOVEL READER MODE CONTENT
  if (!state.currentBookId) {
    renderWelcome();
    return;
  }

  if (!state.activeBook || state.activeBook.id !== state.currentBookId) {
    state.activeBook = await getBookFromDB(state.currentBookId);
  }

  const book = state.activeBook;
  if (!book) return;

  let titleStr = book.title;
  let bodyHTML = '';
  let cur = book.currentIdx + 1;
  let total = 0;

  if (book.isChapterMode) {
    const ch = book.chapters[book.currentIdx];
    if (ch) {
      titleStr = `${book.title} - ${ch.title}`;
      bodyHTML = formatText(ch.content);
    }
    total = book.chapters.length;
  } else {
    total = Math.ceil(book.content.length / book.pageSize);
    const start = book.currentIdx * book.pageSize;
    bodyHTML = formatText(book.content.substring(start, start + book.pageSize));
  }

  if (elTitle) elTitle.innerText = titleStr;
  if (elBody) elBody.innerHTML = bodyHTML;
  if (elProgText) elProgText.innerText = `${cur} / ${total}`;
  
  if (elProgFill) {
    const percent = (cur / total) * 100;
    elProgFill.style.width = percent + '%';
  }

  window.scrollTo({ top: 0, behavior: 'instant' });
}

function renderWelcome() {
  const elTitle = $('articleTitle');
  const elBody = $('articleBody');
  const elProgText = $('progressText');
  
  if (elTitle) elTitle.innerText = 'n8n从入门到精通：掌握现代工作流自动化';
  if (elBody) {
    elBody.innerHTML = `
      <p>欢迎使用新版 CSDN 摸鱼工作台。</p>
      <p><strong>操作指南：</strong></p>
      <ul>
        <li><strong>[Space]</strong>: 快速切换“博客/阅读模式”</li>
        <li><strong>[←] / [→]</strong>: 切换上一页/下一页</li>
        <li><strong>上传文档</strong>: 点击右侧面板导入 TXT 小说</li>
      </ul>
      <p>双击空格即可进入隐身状态。此时屏幕将显示标准的 Spring Boot 技术文档，即便老板站在身后也能从容应对。</p>
    `;
  }
  if (elProgText) elProgText.innerText = '0 / 0';
}

function renderBookshelf() {
  const list = $('bookshelfList');
  if (!list) return;
  list.innerHTML = '';
  
  if (state.booksMetadata.length === 0) {
    list.innerHTML = '<li>还没有导入书籍</li>';
    return;
  }

  state.booksMetadata.forEach((meta) => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    
    const titleSpan = document.createElement('span');
    titleSpan.innerText = '📂 ' + meta.title;
    titleSpan.style.flex = '1';
    titleSpan.onclick = async () => {
      state.currentBookId = meta.id;
      state.activeBook = await getBookFromDB(meta.id);
      state.isReaderMode = true; // Switch to reader mode when choosing a book
      document.body.className = 'mode-reader';
      const statusTxt = $('modeStatusText');
      if (statusTxt) statusTxt.innerText = '阅读模式';
      saveStateToLocalStorage();
      render();
    };

    const delBtn = document.createElement('span');
    delBtn.innerText = ' [x]';
    delBtn.style.color = '#ccc';
    delBtn.style.cursor = 'pointer';
    delBtn.onclick = async (e) => {
      e.stopPropagation();
      if (confirm(`移除《${meta.title}》?`)) {
        await deleteBookFromDB(meta.id);
        state.booksMetadata = await getAllBooksMetadata();
        if (state.currentBookId === meta.id) {
          state.currentBookId = state.booksMetadata.length > 0 ? state.booksMetadata[0].id : null;
          state.activeBook = null;
        }
        saveStateToLocalStorage();
        render();
      }
    };

    li.className = meta.id === state.currentBookId ? 'active' : '';
    li.appendChild(titleSpan);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

function formatText(text) {
  if (!text) return '';
  return text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `<p>${line}</p>`)
    .join('');
}

async function changeNav(dir) {
  if (!state.activeBook || !state.isReaderMode) return;
  const book = state.activeBook;
  const limit = book.isChapterMode ? book.chapters.length : Math.ceil(book.content.length / book.pageSize);
  const nextIdx = book.currentIdx + dir;
  if (nextIdx >= 0 && nextIdx < limit) {
    book.currentIdx = nextIdx;
    await saveBookToDB(book);
    state.booksMetadata = await getAllBooksMetadata();
    render();
  }
}

function saveStateToLocalStorage() {
  localStorage.setItem('toughfish_v3_currentId', state.currentBookId);
}

async function loadState() {
  state.booksMetadata = await getAllBooksMetadata();
  state.currentBookId = localStorage.getItem('toughfish_v3_currentId');
  if (state.currentBookId) {
    state.activeBook = await getBookFromDB(state.currentBookId);
  }
}
