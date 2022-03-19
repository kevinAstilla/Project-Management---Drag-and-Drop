import { Component } from './base-component.js';
import { AutoBind } from '../decorators/autobind.js';
import { Draggable } from '../models/drag-and-drop.js';
import { Project } from '../models/project.js';

export class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements Draggable {
    private project: Project;

    get person(){
        if (this.project.people === 1) {
            return '1 person';
        } else {
            return `${this.project.people} persons`;
        }
    }

    constructor(hostId: string, project: Project){
        super('single-project', hostId, false, project.id);
        this.project = project;

        this.configure()
        this.renderContent()
    }

    @AutoBind
    dragStartHandler(event: DragEvent): void {
        event.dataTransfer!.setData('text/plain', this.project.id)
        event.dataTransfer!.effectAllowed = 'move';
    }

    @AutoBind
    dragEndHandler(_: DragEvent): void {
        console.log('drag has ended');   
    }

    configure(): void {
        this.element.addEventListener('dragstart', this.dragStartHandler);
        this.element.addEventListener('dragend', this.dragEndHandler)
    }

    renderContent(): void {
        this.element.querySelector('h2')!.textContent = this.project.title;
        this.element.querySelector('h3')!.textContent = this.person + ' assigned';
        this.element.querySelector('p')!.textContent = this.project.description;
    }
}