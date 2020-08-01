"use strict";

// Singleton utility object
const Utilities = {
    // in place schuffling
    randomShuffle: array => {
        for (let l1=0; l1<array.length*10;l1++) {
            const i1 = Math.floor(Math.random()*array.length);
            const i2 = Math.floor(Math.random()*array.length);
            const tmp = array[i1];
            array[i1] = array[i2];
            array[i2] = tmp;
        }
    },
    once: (fun, optionalThis) => {
        let wasCalled = false;
        return (...args) => {
            if (wasCalled) {
                return;
            }
            wasCalled = true;
            return fun.apply(optionalThis || null, args);
        }
    }
}

// Class
const Animal = function() {
    this.onChangeCallbacks = [];
}
Animal.prototype = {
    getName: function() {
        return 'Unknown';
    },
    getImg: function() {
        return `images/${this.getName().toLowerCase()}.png`;
    },
    getFact: function() {
        return "";
    },
    setProperty: function(property, value) {
        this[property] = value;
        this.onChangeCallbacks.forEach(fun => {
            fun.call(this, this);
        });
    },
    // callbacks wire together model with controller and let us refresh view only when model changed
    addCallback: function(fun) {
        this.onChangeCallbacks.push(fun);
    },
    getRandomFact: function(animal) {
        var facts = [this.getFact()];
        if (Animal.weightComperator(this, animal) >= 0) {
            facts.push(`You are not heavier than ${this.getName()}`);
        } else {
            facts.push(`You are heavier than ${this.getName()}`);
        }
        if (Animal.heightComperator(this, animal) >= 0) {
            facts.push(`You are not taller than ${this.getName()}`);
        } else {
            facts.push(`You are taller than ${this.getName()}`);
        }
        if (Animal.dietComperator(this, animal) !== 0) {
            facts.push(`You diet is different than that of ${this.getName()}`);
        } else {
            facts.push(`You have the same diet as ${this.getName()}`);
        }
        if (Animal.locationComperator(this, animal)) {
            facts.push(`You live in the same place as ${this.getName()}`);
        }
        return facts[Math.floor(Math.random()*facts.length)];
    }
};
Animal.DIET_ENUM = {
    herbavor: 1,
    omnivor: 2,
    carnivor: 3
};
Animal.weightComperator = (animal1, animal2) => animal1.weight - animal2.weight;
Animal.heightComperator = (animal1, animal2) => animal1.height - animal2.height;
Animal.dietComperator = (animal1, animal2) => Animal.DIET_ENUM[animal1.diet.toLowerCase()] - Animal.DIET_ENUM[animal2.diet.toLowerCase()];
// We want to be able to proccess substring of location like in situation
// when one animal lives in "Asia" and the other in "North America, Asia, Europe"
Animal.locationComperator = (animal1, animal2) => {
    return animal1.where.toLowerCase().includes(animal2.where.toLowerCase()) ||
        animal2.where.toLowerCase().includes(animal1.where.toLowerCase());
};

// Class
const Human = function({name = ''} = {}) {
    Animal.call(this);
    this.name = name;
}
Human.prototype = Object.assign(Object.create(Animal.prototype), {
    getName: function() {
        return this.name;
    },
    getImg: function() {
        return 'images/human.png';
    },
    getHeight: function() {
        return `${this.feet || 0} feet, ${this.inches || 0} inches`;
    },
    getRandomFact: function() {
        return `That's you`;
    }
});
Human.prototype.constructor = Human;

// Class
const Dino = function({...rawDinoObject} = {}) {
    Animal.call(this);
    Object.assign(this, rawDinoObject);
}
Dino.prototype = Object.assign(Object.create(Animal.prototype), {
    getName: function() {
        return this.species;
    },
    getFact: function() {
        return this.fact;
    },
    getHeight: function() {
        return `${this.height} feet`;
    }
});
Dino.prototype.constructor = Dino;

// Class
const Pigeon = function({...rawPigeonObject} = {}) {
    Dino.call(this, rawPigeonObject);
}
Pigeon.prototype = Object.assign(Object.create(Dino.prototype), {
    getRandomFact: function() {
        return this.getFact();
    }
});
Pigeon.prototype.constructor = Pigeon;



// Class
const AnimalController = function(animalModel, humanModel) {
    this.model = animalModel;
    this.$el = document.createElement('div');
    this.humanModel = humanModel;
    this.render();
}
AnimalController.prototype = {
    render: function() {
        this.$el.classList.add('grid-item');
        this.$el.innerHTML = `
            <h3>${this.model.getName()}</h3>
            <img src="${this.model.getImg()}" alt="${this.model.getName()}">
            <p>${this.model.getRandomFact(this.humanModel)}</p>
            <div class="overlay">
                Weight: ${this.model.weight} lbs.<br>
                Height: ${this.model.getHeight()}
            </div>
        `;
    }
};

// Class created with assumption to have only one instancion, could as well be rewritten as singleton
const FormController = function() {
    this.$el = document.querySelector('#dino-compare');
    this.$grid = document.querySelector('#grid');

    this.collectValues = function() {
        // helper function
        const getVal = (elemId) => {
            return document.querySelector(elemId).value;
        };        
        const name = getVal('#name');
        const feet = Number(getVal('#feet'));
        const inches = Number(getVal('#inches'));
        const weight = Number(getVal('#weight'));
        const diet = getVal('#diet');
        const where = getVal('#where');
        const result = {
            name,
            feet,
            inches,
            height: feet + inches/12.0,
            weight,
            diet,
            where
        };
        return result;
    };

    this.hide = function() {
        this.$el.querySelector('.form-container').classList.add('hidden');
        this.$el.querySelector('.toggler').classList.remove('hidden');
        this.$grid.classList.remove('hidden');
    };
    this.show = function() {
        this.$el.querySelector('.form-container').classList.remove('hidden');
        this.$el.querySelector('.toggler').classList.add('hidden');
        this.$grid.classList.add('hidden');
    };
};

const dataPromise = (async function () {
    const response = await fetch('dino.json');
    const data = await response.json();
    return data;
})().catch(err => {
        console.error(err);
        throw err;
    });


dataPromise.then((data) => {
    const grid = document.querySelector('#grid');

    const formController = new FormController('#dino-compare');

    const dinos = data['Dinos'].map(dino => dino.species === "Pigeon" ? new Pigeon(dino) : new Dino(dino));
    // I decided to use shuffle on dinos array to get more intresting infographics
    Utilities.randomShuffle(dinos);

    // human object is created before form initialization so we can set name of our choosing
    // when grid will be created this name will be substituted by name from the form
    const human = new Human({name: 'default'});

    const animals = dinos.slice(0,4).concat([human]).concat(dinos.slice(4, 10000));

    const controllers = [];

    const initGrid = Utilities.once(function() {
        animals.forEach(model => {
            const controller = new AnimalController(model, human);
            controllers.push(controller);
            model.addCallback(model => {
                controller.render();
            });
            grid.append(controller.$el);
        });
    });

    const renderGrid = function() {
        controllers.forEach(controller => controller.render());
    }

    formController.$el.addEventListener('submit', event => {
        const humanValues = formController.collectValues();
        for (const [property, value] of Object.entries(humanValues)) {
            human.setProperty(property, value);
        }
        initGrid();
        renderGrid();
        formController.hide();
        event.preventDefault();
    });
    formController.$el.querySelector('.toggler').addEventListener('click', event => {       
        formController.show();
        event.preventDefault();
    });
}).catch((err) => {
    console.error('Error occured during app initialization.', err);
});
