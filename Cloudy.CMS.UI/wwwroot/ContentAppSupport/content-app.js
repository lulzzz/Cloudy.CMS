﻿import App from '../app.js';
import Blade from '../blade.js';
import FormBuilder from '../FormSupport/form-builder.js';
import Button from '../button.js';
import LinkButton from '../link-button.js';
import DataTable from '../DataTableSupport/data-table.js';
import DataTableButton from '../DataTableSupport/data-table-button.js';
import ContextMenu from '../ContextMenuSupport/context-menu.js';
import List from '../ListSupport/list.js';
import TabSystem from '../TabSupport/tab-system.js';



/* APP */

class ContentApp extends App {
    constructor() {
        super();
        this.open(new ListContentTypesBlade(this));
    }
};

export default ContentApp;



/* LIST CONTENT TYPES BLADE */

class ListContentTypesBlade extends Blade {
    constructor(app) {
        super();

        this.setTitle('What to edit');

        var guid = uuidv4();

        var update = () =>
            fetch('ContentApp/GetContentTypes', { credentials: 'include' })
                .then(response => response.json())
                .catch(e => console.log(e))
                .then(contentTypes => {
                    if (!contentTypes.length) {
                        var image = `<img class="poetry-ui-help-illustration" src="${window.staticFilesBasePath}/ContentAppSupport/images/undraw_coming_home_52ir.svg" alt="Illustration of an idyllic house with a direction sign, indicating a home.">`;
                        var header = '<h2 class="poetry-ui-help-heading">Welcome to your new home!</h2>';
                        var text = '<p>It\'s time to create your first content type:</p>';
                        var code = `<pre class="poetry-ui-help-code">[ContentType("${guid}")]\n` +
                            'public class Page : IContent\n' +
                            '{\n' +
                            '    public string Id { get; set; }\n' +
                            '    public string ContentTypeId { get; set; }\n' +
                            '}</pre>';
                        var textAfterCode = '<p>Save it, build it, and come back here!</p>';

                        var helpContainer = document.createElement('poetry-ui-help-container');
                        helpContainer.innerHTML = image + header + text + code + textAfterCode;

                        var reloadButton = new Button('Done').setPrimary().onClick(() => {
                            helpContainer.style.transition = '0.2s';
                            helpContainer.style.opacity = '0.3';

                            setTimeout(() => update(), 300);
                        });
                        var reloadButtonContainer = document.createElement('div');
                        reloadButtonContainer.style.textAlign = 'center';
                        reloadButtonContainer.append(reloadButton.element);

                        helpContainer.append(reloadButtonContainer);
                        this.setContent(helpContainer);

                        return;
                    }

                    var list = new List();

                    if (contentTypes.filter(t => !t.isSingleton).length) {
                        list.addSubHeader('General');
                        contentTypes.filter(t => !t.isSingleton).forEach(contentType => list.addItem(item => {
                            item.setText(contentType.pluralName);

                            item.onClick(() => {
                                item.setActive();
                                app.openAfter(new ListContentBlade(app, contentType).onClose(() => item.setActive(false)), this);
                            });

                            if (contentTypes.length == 1) {
                                item.element.click();
                            }
                        }));
                    }

                    var singletons = contentTypes.filter(t => t.isSingleton);

                    if (singletons.length) {
                        list.addSubHeader('Singletons');
                        singletons.forEach(contentType => list.addItem(item => {
                            item.setText(contentType.name);

                            var formBuilder = new FormBuilder(`Cloudy.CMS.Content[type=${contentType.id}]`, app);
                            var content = fetch(`ContentApp/GetSingleton?id=${contentType.id}`, { credentials: 'include' }).then(response => response.json());

                            Promise.all([formBuilder.fieldModels, content]).then(results => {
                                item.onClick(() => {
                                    item.setActive();
                                    app.openAfter(
                                        new EditContentBlade(app, contentType, formBuilder, results[1])
                                            .onClose(() => item.setActive(false)),
                                        this);
                                });

                                if (contentTypes.length == 1) {
                                    item.element.click();
                                }
                            });
                        }));
                    }

                    this.setContent(list);
                });

        update();
    }
}

function uuidv4() { // https://stackoverflow.com/a/2117523
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}



/* LIST CONTENT BLADE */

class ListContentBlade extends Blade {
    constructor(app, contentType) {
        super();

        this.setTitle(contentType.pluralName);

        var formBuilder = new FormBuilder(`Cloudy.CMS.Content[type=${contentType.id}]`, app);

        var reload = () =>
            fetch(`ContentApp/GetContentList?contentTypeId=${contentType.id}`, { credentials: 'include' })
                .then(response => response.json())
                .then(response => {
                    var list = new List();
                    response.forEach(content => list.addItem(item => {
                        item.setText(contentType.isNameable ? content.name : content.id);

                        formBuilder.fieldModels.then(fieldModels => item.onClick(() => {
                            item.setActive();
                            app.openAfter(new EditContentBlade(app, contentType, formBuilder, content).onSave(() => item.setText(contentType.isNameable ? content.name : content.id)).onClose(() => item.setActive(false)), this);
                        }));
                    }));
                    this.setContent(list);
                });

        reload();

        this.setToolbar(
            new Button('New').setInherit().onClick(() =>
                formBuilder.fieldModels.then(fieldModels => app.openAfter(new EditContentBlade(app, contentType, formBuilder).onSave(() => reload()), this))
            )
        );
    }
}



/* EDIT CONTENT */

class EditContentBlade extends Blade {
    onSaveCallbacks = [];

    constructor(app, contentType, formBuilder, content) {
        super();

        if (!content) {
            content = {};
        }

        if (content.id) {
            if (contentType.isNameable && content.name) {
                this.setTitle(`Edit ${content.name}`);
            } else {
                this.setTitle(`Edit ${contentType.name}`);
            }

            if (contentType.isRoutable) {
                fetch(`ContentApp/GetUrl?id=${encodeURIComponent(content.id)}&contentTypeId=${encodeURIComponent(content.contentTypeId)}`, {
                    credentials: 'include',
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                    .then(response => response.text())
                    .then(url => {
                        if (!url) {
                            return;
                        }

                        url = url.substr(1, url.length - 2);

                        this.setToolbar(new LinkButton('View', `${location.origin}${url}`, '_blank').setInherit());
                    });
            }
        } else {
            this.setTitle(`New ${contentType.name}`);
        }

        formBuilder.fieldModels.then(fieldModels => {
            var groups = [...new Set(fieldModels.map(fieldModel => fieldModel.descriptor.group))].sort();
            
            if (groups.length == 1) {
                formBuilder.build(content, { group: groups[0] }).then(form => this.setContent(form));

                return;
            }

            var tabSystem = new TabSystem();

            if (groups.indexOf(null) != -1) {
                tabSystem.addTab('General', () => {
                    var element = document.createElement('div');
                    formBuilder.build(content, { group: null }).then(form => form.appendTo(element));
                    return element;
                });
            }

            groups.filter(g => g != null).forEach(group => tabSystem.addTab(group, () => {
                var element = document.createElement('div');
                formBuilder.build(content, { group: group }).then(form => form.appendTo(element));
                return element;
            }));

            this.setContent(tabSystem);
        });

        var saveButton = new Button('Save')
            .setPrimary()
            .onClick(() =>
                fetch('ContentApp/SaveContent', {
                    credentials: 'include',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: content.id,
                        contentTypeId: contentType.id,
                        content: JSON.stringify(content)
                    })
                })
                    .then(() => this.onSaveCallbacks.forEach(callback => callback(content)))
            );
        var cancelButton = new Button('Cancel').onClick(() => app.close(this));
        var paste = text => {
            const value = JSON.parse(text);

            for (let [propertyKey, propertyValue] of Object.entries(content)) {
                if (propertyKey == 'id') {
                    continue;
                }

                if (propertyKey == 'contentTypeId') {
                    continue;
                }

                if (propertyKey == 'language') {
                    continue;
                }

                if (!(propertyKey in value)) {
                    delete content[propertyKey];
                }
            }
            for (let [propertyKey, propertyValue] of Object.entries(value)) {
                if (propertyKey == 'id') {
                    continue;
                }

                if (propertyKey == 'contentTypeId') {
                    continue;
                }

                if (propertyKey == 'language') {
                    continue;
                }

                content[propertyKey] = propertyValue;
            }
        };
        var moreButton = new ContextMenu()
            .addItem(item => item.setText('Copy').onClick(() => navigator.clipboard.writeText(JSON.stringify(content, null, '  '))))
            .addItem(item => item.setText('Paste').onClick(() => { app.closeAfter(this); navigator.clipboard.readText().then(paste); }));

        this.setFooter(saveButton, cancelButton, moreButton);
    }

    onSave(callback) {
        this.onSaveCallbacks.push(callback);

        return this;
    }
}