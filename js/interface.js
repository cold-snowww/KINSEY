'use strict';
// Скрипты для страницы с интерфейсом

// Подключение кнопок вывода разделов во фрейм
// и кнопок глобальной навигации

class PageNavigator {
    
    constructor() {  
        // Получение ссылок используемые объекты
        this.frame = document.getElementById('main-frame'); 
        this.navigationMenu = document.getElementById('navigationMenu');
        this.linkList = document.getElementById('contentLinks');
        this.slideHeader = document.querySelector('.header-main');  
        this.minTrackLength = 150;
        
        // Добавить поведение кликов внутри меню навигации
        this.navigationMenu.addEventListener('pointerdown', event => {
            this.navPanelHandler(event, this);
        }); 
        
        // Добавить поведение открытия боковых меню
        if(navigator.maxTouchPoints > 0) {            
            this.slideHeader.addEventListener('pointerdown', event => {
                this.slideOnHeader(event, this);
            });            
        }

        // Добавить поведение закрытия меню по нажатию на кнопку
        document.getElementById('linksCloseBth').addEventListener('pointerup', () => {            
            this.closePanel(this.linkList);
        });
        document.getElementById('navigationCloseBtn').addEventListener('pointerup', () => {
            this.closePanel(this.navigationMenu);
        }); 

        // Добавить поведение открытия / закрытия вложенных листов ссылок

        this.linkList.addEventListener('pointerdown', event => {
            // Если это не nested-list-header завершить функцию
            if(!event.target.matches('.nested-list-header')) return;

            // Обработка открытия или закрытия
            if(event.target.matches('.closed')) {                
                this.openNestedList(event.target);
            } else {
                this.closeNestedList(event.target);
            }
        });
    }        
    
    slideOnHeader(event, pageHandler) {
        // Отметить стартовую точку
        let startPoint = event.clientX;

        // Привязать pointerId к slideHeader
        pageHandler.slideHeader.setPointerCapture(event.pointerId);

        // Добавить слушатель к slideHeader для контроля движения указателя
        pageHandler.slideHeader.addEventListener('pointermove', slide);

        // Функция для определения свайпа по движению указателя
        function slide(event) {
            // Вычислить путь указателя при свайпе
            let trackLength = startPoint - event.clientX;

            // Если длинна трека недостаточна  - выход
            if(Math.abs(trackLength) < pageHandler.minTrackLength) return;

            // Если свайп слева направо для планшета - выход
            let direction = (trackLength < 0) ? 'leftToRight' : 'rightToLeft';
            // if(pageHandler.gadgetType === 'tablet' && direction === 'leftToRight') return;

            // Обработка свайпа
            if(direction === 'rightToLeft') {
                pageHandler.openPanel(pageHandler.navigationMenu);
            } else {
                pageHandler.openPanel(pageHandler.linkList);
            }

            // Удалить слушатель контроля движения указателя
            pageHandler.slideHeader.removeEventListener('pointermove', slide);
        }

    }
    
    // Функция обработки кликов на панели навигации
    navPanelHandler(event, pageHandler) {
        if(event.target.hasAttribute('data-src')) {
            pageHandler.follow(event.target.dataset.src);
            pageHandler.closePanel(pageHandler.navigationMenu);
        }
    }    

    // Вывод раздела во фрейм
    follow(link) {        
        this.frame.src = link;         
    }

    // Функция открытия панели
    openPanel(panel) {
        panel.classList.remove('closed');
    }

    // Функция закрытия панели
    closePanel(panel) {
        panel.classList.add('closed');
    }

    // Функция открытия вложенного листа ссылок
    openNestedList(nestedListHeader) {
        nestedListHeader.parentElement.querySelectorAll('li')
            .forEach(li => li.style.display = 'block');
        setTimeout(() => {
            nestedListHeader.classList.remove('closed');
        }, 0);
    }

    // Функция закрытия вложенного листа ссылок
    closeNestedList(nestedListHeader) {
        nestedListHeader.classList.add('closed');
        setTimeout(() => {
            nestedListHeader.parentElement.querySelectorAll('li')
                .forEach(li => li.style.display = 'none');
        }, 500);
    }
}

// Обработчик ошибки на уровне окна
window.addEventListener('error', showError);

try {
    // Создание объекта навигатора
    new PageNavigator();


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