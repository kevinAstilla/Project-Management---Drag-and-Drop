import { Component } from './base-component.js';
import { Validatable, validate } from '../utils/validation.js';
import { AutoBind } from '../decorators/autobind.js';
import { projectState } from '../state/project-state.js';

export class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
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
