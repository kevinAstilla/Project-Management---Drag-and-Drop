import { Component } from "./base-component";
import { ProjectItem } from "./project-item";
import { projectState } from '../state/project-state';
import { AutoBind } from '../decorators/autobind';
import { DragTarget } from '../models/drag-and-drop';
import { Project, ProjectStatus } from '../models/project';


export class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget{
    assignedProjects: Project[];

    constructor(private type: "active" | "finished") {
        super('project-list', 'app', false, `${type}-projects` );
        this.assignedProjects = []
        this.configure();
        this.renderContent();
    }

    private renderProjects() {
        const listElement = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
        listElement.innerHTML = '';
        for (const prjItem of this.assignedProjects) {
            new ProjectItem(this.element.querySelector('ul')!.id, prjItem);
        }
    }

    @AutoBind
    dragOverHandler(event: DragEvent): void {
        if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
            event.preventDefault();
            const list = this.element.querySelector('ul')!;
            list.classList.add('droppable');
        }
    }

    @AutoBind
    dragLeaveHandler(event: DragEvent): void {
        event.preventDefault();
        const list = this.element.querySelector('ul')!;
        list.classList.remove('droppable');
    }

    @AutoBind
    dropHandler(event: DragEvent): void {
        event.preventDefault();
        const projectId = event.dataTransfer!.getData('text/plain');
        projectState.moveProject(projectId, this.type === 'active' ? ProjectStatus.Active: ProjectStatus.Finished);
    }

    configure(): void {
        this.element.addEventListener('dragover', this.dragOverHandler);
        this.element.addEventListener('dragleave', this.dragLeaveHandler);
        this.element.addEventListener('drop', this.dropHandler);

        projectState.addListener((projects: Project[]) => {
            const relevantProjects = projects.filter(prj => {
                if (this.type === 'active') {
                    return prj.status === ProjectStatus.Active;
                }
                return prj.status === ProjectStatus.Finished;
            })
            this.assignedProjects = relevantProjects;
            this.renderProjects();
        });   
    }

    renderContent() {
        const listId = `${this.type}-projects-list`;
        this.element.querySelector('ul')!.id = listId;
        this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + " PROJECTS";
    }
}