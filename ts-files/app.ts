//interface for the drag and drop
interface Draggable {
    dragStartHandler(event:  DragEvent): void;
    dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
    dragOverHandler(event: DragEvent): void;
    dropHandler(evet: DragEvent): void;
    dragLeaveHandler(event: DragEvent): void;
}

enum ProjectStatus {
    Active,
    Finished
}
// Project class
class Project {
    constructor(
        public id: string,
        public title: string,
        public description: string,
        public people: number,
        public status: ProjectStatus

    ) {}
}

type Listener<T> = (items: T[]) => void;

abstract class State<T> {
    protected listeners: Listener<T>[] = [];

    addListener(listenerFn: Listener<T>) {
        this.listeners.push(listenerFn);
    }

}

//Project State is a singleton that handles the project states
class ProjectState extends State<Project> {
    private projects: Project[] = [];
    private static instance: ProjectState;

    private constructor() {
        super()

    }
    static getInstance() {
        if (this.instance) {
            return this.instance
        }
        this.instance = new ProjectState();
        return this.instance;
    }

    addProject(title: string, description: string, numOfPeople: number) {
        const newProject = new Project(Math.random().toString(), title, description, numOfPeople, ProjectStatus.Active);
        this.projects.push(newProject);
        this.updateListeners();
    }

    moveProject(projectId: string, newStatus: ProjectStatus) {
        const project = this.projects.find(prj => prj.id === projectId);
        if (project && project.status !== newStatus) {
            project.status = newStatus;
            this.updateListeners();
        }
    }

    private updateListeners() {
        for (const listenerFn of this.listeners) {
            //slice() would pass a brand new copy
            listenerFn(this.projects.slice())
        }
    }
}

const projectState = ProjectState.getInstance();

// the question mark is the same as adding "| undefined"
interface Validatable {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number
}
function validate(validatableInput: Validatable) {
    let isValid = true;
    if (validatableInput.required) {
        isValid = isValid && validatableInput.value.toString().trim().length !== 0;
    }
    if (validatableInput.minLength != null && typeof validatableInput.value === "string") {
        isValid = isValid && validatableInput.value.length > validatableInput.minLength;
    }
    if (validatableInput.maxLength != null && typeof validatableInput.value === "string") {
        isValid = isValid && validatableInput.value.length < validatableInput.maxLength;
    }
    if (validatableInput.min != null && typeof validatableInput.value === "number") {
        isValid = isValid && validatableInput.value >= validatableInput.min;
    }
    if (validatableInput.max != null && typeof validatableInput.value === "number") {
        isValid = isValid && validatableInput.value <= validatableInput.max;
    }
    return isValid;
}
// the udnerscore prefix just means that we wont be using the parameter
function AutoBind(_target: any, _methodName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const adjDescriptor: PropertyDescriptor = {
        configurable: true,
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn;
        }
    };
    return adjDescriptor;
}

abstract class Component<T extends HTMLElement, U extends HTMLElement> {
    templateElement: HTMLTemplateElement;
    hostElement: T;
    element: U;

    constructor(templateId: string, hostElementId: string, insertAtStart: boolean, newElementId?: string) {
        // the "as" typecasting method is the same as <>
        this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
        this.hostElement = document.getElementById(hostElementId)! as T;

        // why do we do this? this is to make sure we only make this with the node inside the template
        const importedNode = document.importNode(
            this.templateElement.content,
            true
        );
        this.element = importedNode.firstElementChild as U;
        if (newElementId) {
            this.element.id = newElementId;
        }
        this.attach(insertAtStart)
    }

    private attach(insertAtStart: boolean) {
        this.hostElement.insertAdjacentElement(insertAtStart ? 'afterbegin' : 'beforeend', this.element)
    }

    abstract configure(): void;
    abstract renderContent(): void;
}
class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements Draggable {
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
class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget{
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

class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

    constructor() {
        super('project-input', 'app', true, 'user-input')

        this.titleInputElement = this.element.querySelector("#title") as HTMLInputElement;
        this.descriptionInputElement = this.element.querySelector("#description") as HTMLInputElement;
        this.peopleInputElement = this.element.querySelector("#people") as HTMLInputElement;
        
        this.configure();
    }
    
    renderContent(): void {}

    // the bind determins how this should be treated
    configure() {
        this.element.addEventListener('submit', this.submitEventHandler)
    }

    private clearInput() {
        this.titleInputElement.value = "";
        this.descriptionInputElement.value = "";
        this.peopleInputElement.value = "";
    }

    // we are declaring that we are returning a tuple
    private gatherUserInput(): [string, string, number] | void {
        const enteredTitle = this.titleInputElement.value;
        const enteredDescription = this.descriptionInputElement.value;
        const enteredPeople = this.peopleInputElement.value;

        const titleValidatable: Validatable = {
            value: enteredTitle,
            required: true
        };

        const descrptionValidatable: Validatable = {
            value: enteredDescription,
            required: true,
            minLength: 5
        };

        const peopleValidatable: Validatable = {
            value: +enteredPeople,
            required: true,
            min: 1,
            max: 5
        };
        if (
            !validate(titleValidatable) ||
            !validate(descrptionValidatable) ||
            !validate(peopleValidatable)
        ) {
            alert("invalid input");
            return;
        } else {
            return [enteredTitle, enteredDescription, +enteredPeople];
        }
    }
    @AutoBind
    private submitEventHandler(event: Event) {
        event.preventDefault();

        const userInput = this.gatherUserInput()
        if (Array.isArray(userInput)) {
            const [title, description, people] = userInput;

            projectState.addProject(title, description, people);
            this.clearInput();
        }
    }
}

const projectInput = new ProjectInput();
const activeProjects = new ProjectList('active');
const finishedProjects = new ProjectList('finished');