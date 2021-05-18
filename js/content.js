'use strict';

// Скрипты для страниц с контентом отображаемых во фрейме

// Создание обработчиков функциональности кнопок навигации
// внутри фрейма
function historyNavigate() {
    document.getElementById('navigation-back')
        .addEventListener('click', () => window.history.back());
    document.getElementById('navigation-next')
        .addEventListener('click', () => window.history.forward());
    document.getElementById('navigation-reload')
        .addEventListener('click', () => window.location.reload());
}

// Цветовое форматирование кода и добавление функциональности
// справочных элементов с выводом на внутренний дисплей
class CodeFormatter { 

    // Данные для форматирования JS блоков 
    js = {

        // Шаблон для поиска ключевых слов
        keyWordsRegexp: /(?<!\.)\b[a-z]+\b/g,

        // Ключевые слова
        keyWords: {            
            red: [
                'await', 'break', 'case', 'catch', 'continue',
                'debugger', 'default', 'delete', 'do', 'else',
                'export', 'extends', 'finally', 'for', 'from', 'goto',
                'if', 'import', 'in', 'instanceof', 'new', 'as',
                'package', 'return', 'switch', 'throw', 'try',
                'typeof', 'void', 'while', 'with', 'yield', 'of'       
            ],
            cyan: [
                'class', 'const', 'eval', 'function', 'interface',
                'let', 'var'
            ],
            purple: [ 
                'false', 'null', 'true', 'undefined', 'NaN'
            ],
            orange: [
                'arguments', 'super', 'this'
            ],
            grey: [
                'abstract', 'boolean', 'byte', 'char', 'double',
                'enum', 'final', 'float', 'implements', 'int',
                'long', 'native', 'private', 'protected', 'public',
                'short', 'static', 'synchronized', 'throws', 
                'transient', 'volatile'
            ]
        },

        // Шаблоны форматирования
        templates: {
            stringVariables:    [/(?<=(`.*))\${.+?}(?=(.*`))/gs, 'fuchsia'],
            templateStrings:    [/`[^`]*?`/gs, 'brown'],
            strings:            [/(["']).*?[^\\]\1/g, 'brown'],  
            regexp:             [/\/.+\/[igmsuy]*/g, 'fuchsia'], 
            comments:           [/(?<=^\s*)\/\/.+$/gm, 'pink'],           
            functions:          [/\b[\w-]+?(?=\()/g, 'lime'],
            properties:         [/\b\w+(?=:)/g, 'green'],
            numbers:            [/(?<!¡)\b\d+\.?\d*\b(?!¬)/g, 'purple'],
            operators:          [/(&gt;){1,3}|(&lt;){1,3}|[-+*/=\?\!]+|(\.{3})|(&amp;&amp;)|(\|\|)/g, 'red'],
            brackets:           [/[\(\)\[\]\{\}]/g, 'yellow'],
            bitwise:            [/[~\^|]|(&amp;) /g, 'red']
        }
    };  
    
    // Данные для форматирования HTML блоков
    html = {

        // Шаблоны форматирования
        templates: {
            tags:               [/(?<=&lt;\/?)[\w-]+/g, 'red'],
            attrData:           [/(?<=\=)".+?"/g, 'brown'],
            attributes:         [/(?<=&lt;[^(&gt;)]*) [\w-]+=/g, 'lime']
        }
    };

    // Данные для форматирования CSS блоков
    css = { 

        // Шаблон подбора ключевых слов
        keyWordsRegexp: /\b[a-z]+\b()/g,

        // Ключевые слова
        keyWords: {            
            pink: ['initial', 'inherit', 'unset', 'revert', 'auto'],            
        },      
        
        // Шаблоны форматирования
        templates: {
            comments:           [/\/\*.+?\*\//gs, 'grey'],
            pseudo:             [/\:{1,2}[a-z-]+\b(?=(.*\{))/gi, 'red'],
            mediaRules:         [/@[a-z-]+/g, 'red'],
            selectorData:       [/\(.+?\)(?=(.*\{))/, 'brown'],
            relSelect:          [/[*~+]|(&gt;)(?=(.*\{))/g, 'red'],
            attrSelect:         [/\[.*?\](?=(.*\{))/gi, 'brown'],
            placeholders:       [/%[a-z-]+/g, 'red'],
            variables:          [/\$[a-z-]+\b/g, 'red'],
            colors:             [/#[0-9a-f]{3,6}\b/gi, 'orange'],           
            numbers:            [/(?<!¡)-?\b\d+\.?\d*([a-z]*\b)|%(?!¬)/g, 'fuchsia'],  
            props:              [/[a-z-]+\:/gi, 'cyan'],
            ampersands:         [/&amp;/g, 'red'],
            selectors:          [/[\.#%]?[a-z-]+(?=(.*\{))/gim, 'lime'],
            custProps:          [/var\(--[\w-]+\)/g, 'blue'],
            textVals:           [/'[\w./ -]+'/gi, 'orange'],
            brackets:           [/[\{\}\)\(]/g, 'yellow'],
        }
    };

    // Данные для форматирования текстовых блоков
    text = {

        // Шаблоны форматирования
        templates: {
            // units:              [/(?<=\d)([a-z]+\b)|%/g, 'red'],           
            // numbers:            [/(?<!\&)\b\d+\.?\d*(?!#)/g, 'purple'],
            // tags:               [/&lt;|&gt;/g, 'red'],
            // engTerms:           [/([a-z]+[_.-]?)+/gi, 'green']
        }
    };

    // Шаблон справочных тегов
    refTags = /<span data-reference=".*?">[i\d]{1,2}<\/span>/g;
    // Шаблон тегов маркеров
    markTags = /<span class="code-[\w-]+?">.+?<\/span>/gs;
    // Общий шаблон html тега
    tags = /<\/?[a-z][^>]*?>/g;    

    // !!!!!!!!!!!!! МЕТОДЫ РАБОТЫ С КОНТЕНОТОМ !!!!!!!!!!!!!
    // Общая функция для извлечения элементов по шаблону
    replace(template) {
        this.content = this.content.replace( 
            template, match => {
                this.tagBase.push(match);
                return `¡${this.tagBase.length-1}¬`;
            }
        );
    }

    // Функция замены найденного шаблона строкой в this.content
    modifyContent(reg, str) {
        this.content = this.content.replace(reg, str);
    } 

    // Функция для извлечения ключевых слов
    keyWordReplace(template, keyWords) {
        // Итерируемый объект найденных слов, соответствующих шаблону
        let matches = this.content.match(template);
        if(!matches) return;  

        // Объект MAP для хранения найденных ключевых слов
        let findedKeyWords = new Map;

        // Функция проверяющая наличие ключевого слова в базе, принимает слово, возвращает цвет или false
        function checkWord(word) {
            for(let [color, keyWordsArray] of Object.entries(keyWords)) {                
                if(keyWordsArray.includes(word)) return color;
            }            
            return false;
        }

        // Ищем совпадения и помещаем их в findedKeyWords
        Array.from(matches).forEach(word => {
            let checkResult = checkWord(word);            
            if(checkResult && !findedKeyWords.has(word)) {
                findedKeyWords.set(word, checkResult);
            }
        });

        // Заменяем найденные совпадения тегами
        for(let [keyWord, color] of findedKeyWords) {
            this.modifyContent(
                new RegExp(`(?<!\\.)\\b${keyWord}\\b(?!=)`, 'g'),
                `<span class="code-${color}">$&</span>`
            );
        }

        // Извлечение маркированных ключевых слов
        this.replace(this.markTags);
    }

    // Замена <> на безопасные знаки
    // moreLessReplace() {
    //     this.modifyContent(/</g, '&lt;');
    //     this.modifyContent(/>/g, '&gt;');
    // }

    // Разметка и извлечение элеметов по регулярным выражениям 
    templatesReplace(templates) {
        this.modifyContent(
            templates[0], 
            `<span class="code-${templates[1]}">$&</span>`
        );        
        this.replace(this.markTags);
    }

    // Нумерация строк внутри контейнера если numbering false - только обрезка пробелов
    linePrep(numbering) {
        // Убираем лишние пробелы
        // Наименьшее количество пробелов в строке
        let minSpaces = this.content
            .match(/^ *(?=[^\n\s])/gm)
            .map(spaces => spaces.length)
            .reduce((prev, item) => {
                return (prev < item) ? prev : item;
            }, 100);

        console.log(this.content);
        
        // Срезаем лишние пробелы в каждой строке
        this.modifyContent(new RegExp(`\^ {${minSpaces}}`, 'gm'), '' );

        // Удаляем пустые строки в конце фрагмента кода     
        this.modifyContent(/\s+$/, '');

        // Нумеруем строки
        if(numbering) {
            let i = 1;
            this.modifyContent(/^/gm, 
                match => {                            
                    if(i <= 9)   return `<span class="code-grey">${i++}   </span>`;
                    if(i <= 99)  return `<span class="code-grey">${i++}  </span>`;
                    if(i <= 999) return `<span class="code-grey">${i++} </span>`;
                }
            );
        }        
    }

    // Обратная замена маркеров тегами из tagBase
    contentRestore() {
        for(let i = this.tagBase.length - 1; i >= 0; i--) {
            this.content = this.content.replace(
                new RegExp(`¡${i}¬`), this.tagBase[i]
            ); 
        }
    }

    // Вывод значения [data-reference] на дисплей
    showReference(target) {
        // Вывести значение на дисплей
        this.refDisplay.innerHTML = target.dataset.reference;
    }

    // Очистка дисплея
    clearRefText() {
        this.refDisplay.innerHTML = null;
    }

    // !!!!!!!!!!!!! КОНСТРУКТОР ОБЪЕКТА !!!!!!!!!!!!!
    constructor() {
        // Цветовое форматирование кода
        // Для форматирования блока кода использовать <pre data-formatted="js">code</pre>
        // Найти все контейнеры для форматирования, выполнить для каждого из них 
        // определенный набор инструкций в зависимости от значения атрибута data-formatted 
        for(let preContainer of document.querySelectorAll('[data-formatted]')) {        
            // Определить тип форматирования контента
            let type = preContainer.dataset.formatted;
            // Выбрать исходные данные для форматирования контейнера
            let data = this[type];
            // Создать массив для хранения вырезанных тегов
            this.tagBase = [];
            // Извлечь контент из контейнера для обработки
            this.content = preContainer.innerHTML;  

            // Обработка контента
            // Вырезать справочные теги
            this.replace(this.refTags);
            // Заменить скобки тегов безопасными знаками
            // this.moreLessReplace();            
            
            // Обработка js контейнеров
            if(type === 'js') {                
                // Обработать массив шаблонов
                Object.keys(data.templates).forEach(template => {
                    if(template === 'functions') {
                        // Заменить ключевые слова
                        this.keyWordReplace(data.keyWordsRegexp, data.keyWords);
                    }
                    this.templatesReplace(data.templates[template]);
                });

                // Заменить маркеры тегами в обратном порядке
                this.contentRestore();
                
                // Пронумеровать строки
                this.linePrep(true);                
            }

            // Обработка html контейнеров
            if(type === 'html') {
                // Обработать массив шаблонов
                Object.keys(data.templates).forEach(template => {
                    this.templatesReplace(data.templates[template]);
                });

                // Заменить маркеры тегами в обратном порядке
                this.contentRestore();
                
                // Пронумеровать строки
                this.linePrep(true); 
            }
            
            // Обработка CSS контейнеров
            if(type === 'css') {
                // Заменить ключевые слова
                this.keyWordReplace(data.keyWordsRegexp, data.keyWords);
                
                // Обработать массив шаблонов
                Object.keys(data.templates).forEach(template => {
                    this.templatesReplace(data.templates[template]);
                });

                // Заменить маркеры тегами в обратном порядке
                this.contentRestore();
                
                // Пронумеровать строки
                this.linePrep(true); 
            }

            // Обработка текстовых контейнеров
            if(type === 'text') {
                // Обработка маркированных участков
                this.modifyContent(/ˇ.+?ˇ/g,
                    match => {
                        let strimmed = match.slice(1, match.length - 1);                        
                        return `<span class="code-fuchsia">${strimmed}</span>`;                        
                    }    
                );

                // Заменить маркеры тегами в обратном порядке
                this.contentRestore();

                // Обрезать пробелы и пустые строки
                this.linePrep(false);                
            }

            // Вставить данные в контейнер и обнулить ссылки                    
            preContainer.innerHTML = this.content;
            this.content = null;
            this.tagBase = null;
        }       

        // Добавление справочных элементов
        // Для добавления справочного элемента использовать 
        // <span data-reference="Справочная информация">i</span>
        this.refDisplay = document.getElementById('reference-display');

        if(navigator.maxTouchPoints) {
            // Обработчики событий мобильных устройств
            window.addEventListener('pointerdown', event => {
                // Выйти если отсутствует data-reference
                if(!event.target.hasAttribute('data-reference')) return;

                this.showReference(event.target);
            });
        } else {
            // Обработчики событий десктопных устройств
            window.addEventListener('mouseover', event => {
                // Выйти если отсутствует data-reference
                if(!event.target.hasAttribute('data-reference')) return;

                this.showReference(event.target);                
            });
            window.addEventListener('mouseout', event => {
                // Выйти если отсутствует data-reference
                if(!event.target.hasAttribute('data-reference')) return;

                this.clearRefText();                
            });        
        }
    }
}

// Обработчик ошибки на уровне окна
window.addEventListener('error', showError);

// Обработка ошибки
try {    
    // Подключение навигации внутри фрейма
    historyNavigate();
    
    // Форматирование кода и создание справочных элементов
    // если таковые имеются
    if(document.querySelector('[data-reference], [data-formatted]')) {
        new CodeFormatter();
    }    
} catch (error) {
    showError(error);
}

function showError(error) {
    let errorBlock = document.createElement('div');
        errorBlock.style.cssText = `
            position: absolute;
            z-index: 999999;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            padding: 20px 30px;
            line-height: 1.2;
            font-size: 1.2rem;
            font-family: monospace;
            border: 3px solid #ff6b88;
            color: #ff6b88;
            background-color: #000;
        `;
        
        if(error instanceof Error) {
            errorBlock.innerHTML = `
            Ошибка: ${error.name} <br><br>
            Сообщение: ${error.message} <br><br>
            Стек: ${error.stack}
        `;
        } else {
            errorBlock.innerHTML = `
                Ошибка верхнего уровня! <br><br>
                Сообщение: ${error.message} <br><br>
                Файл: ${error.filename} <br><br>
                Строка: ${error.lineno}
            `;
        }
    document.body.append(errorBlock);
}