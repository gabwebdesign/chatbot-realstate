import { History } from "./handleHistory";

interface BotState {
    history: History[];
    currentFlow: string;
    propertyId: string;
    userName: string;
}

class GlobalState {
    private static instance: GlobalState;
    private state: BotState;

    private constructor() {
        this.state = {
            history: [],
            currentFlow: '',
            propertyId: '',
            userName: ''
        };
    }

    public static getInstance(): GlobalState {
        if (!GlobalState.instance) {
            GlobalState.instance = new GlobalState();
        }
        return GlobalState.instance;
    }

    public getHistory(): History[] {
        return this.state.history;
    }

    public getCurrentFlow(): string {
        return this.state.currentFlow;
    }

    public addToHistory(message: History): void {
        this.state.history.push(message);
    }

    public changeCurrentFlow(flow: string): void {
        this.state.currentFlow = flow;
    }
    
    public getPropertyId(): string {
        return this.state.propertyId;
    }

    public setPropertyId(propertyId: string): void {
        this.state.propertyId = propertyId;
    }

    public getUserName(): string {
        return this.state.userName;
    }

    public setUserName(name: string): void {
        this.state.userName = name;
    }

    public clearHistory(): void {
        this.state.history = [];
    }
}

const globalState = GlobalState.getInstance();

export {
    globalState as GlobalState
};