// navbarState.js
export class NavBarState {
    constructor() {
        this.activeFiltersCount = 0; // filtri attivi
        this.mentionsCount = 0;      // menzioni     
        this.resultsCount = 0;       // luoghi
        this.uniqueResultsCount = 0; // riferimenti 
        this.isFiltersOpen = true;   // pannello filtri
        this.isResultsOpen = true;   // pannello riferimenti
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

    getSnapshot() {
        return {
            activeFiltersCount: this.activeFiltersCount,
            resultsCount: this.resultsCount,
            uniqueResultsCount: this.uniqueResultsCount,
            isFiltersOpen: this.isFiltersOpen,
            isResultsOpen: this.isResultsOpen
        };
    }

    reset() {
        this.update({
            activeFiltersCount: 0,
            mentionsCount: 0,              
            resultsCount: 0,
            uniqueResultsCount: 0,
            isFiltersOpen: true,
            isResultsOpen: true
        });
    }

    // Getter per compatibilità (così puoi usare this.state.propertyName nel renderer)
    get state() {
        return this.getSnapshot();
    }
}