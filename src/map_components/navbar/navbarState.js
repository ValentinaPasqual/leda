// navbarState.js
export class NavBarState {
    constructor() {
        this.activeFiltersCount = 0;
        this.resultsCount = 0;
        this.uniqueResultsCount = 0;
        this.isFiltersOpen = true;
        this.isResultsOpen = true;
        this.listeners = new Map();
    }

    update(updates) {
        const changed = {};
        Object.entries(updates).forEach(([key, value]) => {
            if (this[key] !== value) {
                changed[key] = { old: this[key], new: value };
                this[key] = value;
            }
        });
        
        if (Object.keys(changed).length > 0) {
            this.notify(changed);
        }
    }

    subscribe(callback) {
        const id = Math.random().toString(36);
        this.listeners.set(id, callback);
        return () => this.listeners.delete(id);
    }

    notify(changes) {
        this.listeners.forEach(cb => cb(changes));
    }
}