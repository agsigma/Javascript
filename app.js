"use strict";
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
            return fun.apply(optionalThis || null, args)
        }
    }
}


// Create Dino Constructor
const Animal = function() {
    this.onChangeCallbacks = []
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
    addCallback: function(fun) {
        this.onChangeCallbacks.push(fun);
    }
};

const Human = function({name = "Sigma"} = {}) {
    Animal.call(this);
    this.name = name;
}
Human.prototype = Object.assign(Object.create(Animal.prototype), {
    getName: function() {
        return this.name;
    },
    getImg: function() {
        return 'images/human.png';
    }
});
Human.prototype.constructor = Human;

const Dino = function({...imVeryLazy} = {}) {
    Animal.call(this);
    Object.assign(this, imVeryLazy);
}
Dino.prototype = Object.assign(Object.create(Animal.prototype), {
    getName: function() {
        return this.species;
    },
    getFact: function() {
        return this.fact;
    },
});
Dino.prototype.constructor = Dino;


const AnimalController = function(animalModel) {
    this.model = animalModel;    
    this.$el = document.createElement('div');
    this.render();
}
AnimalController.prototype = {
    render: function() {        
        this.$el.classList.add('grid-item');
        this.$el.innerHTML = `        
            <h3>${this.model.getName()}</h3>
            <img src="${this.model.getImg()}" alt="${this.model.getName()}">
            <p>${this.model.getFact()}</p>
            <div class="overlay">
                Weight: ${this.model.weight} lbs.<br>
                Height: ${this.model.height} feet
            </div>
        `;
    }
};

const FormController = function() {
    this.$el = document.querySelector('#dino-compare');

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
        const result = {
            name,
            feet,
            inches,
            height: `${feet || 0} feet, ${inches || 0} inches`,
            weight,
            diet
        };
        return result;
    };

    this.hide = function() {
        this.$el.querySelector('.form-container').classList.add('hidden');
        this.$el.querySelector('.toggler').classList.remove('hidden');
    };
    this.show = function() {
        this.$el.querySelector('.form-container').classList.remove('hidden');
        this.$el.querySelector('.toggler').classList.add('hidden');
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

    const dinos = data['Dinos'].map(dino => new Dino(dino));    
    Utilities.randomShuffle(dinos);

    const human = new Human({name: 'Trololo'});

    const animals = dinos.slice(0,4).concat([human]).concat(dinos.slice(4, 10000));

    const initGrid = Utilities.once(function() {
        animals.forEach(model => {
            const controller = new AnimalController(model);        
            model.addCallback(model => {
                controller.render();
            });
            grid.append(controller.$el);
        });
    });

    formController.$el.addEventListener('submit', event => {
        const humanValues = formController.collectValues();
        for (const [property, value] of Object.entries(humanValues)) {            
            human.setProperty(property, value);            
        }
        initGrid();
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


// I don't understand why I should write comparision functions because there is no need for them in the application, 
// but maybe I missed something from app description. Nevertheless for the sake of assigment here they are(as static methods):
// usage: array.sort(Animal.weightComperator)
Animal.DIET_ENUM = {
    herbavor: 1,
    omnivor: 2,
    carnivor: 3
};
Animal.weightComperator = (animal1, animal2) => animal1.weight - animal2.weight;
Animal.heightComperator = (animal1, animal2) => (animal1.feet||0)*12+(animal1.inches||0) - (animal2.feet||0)*12+(animal2.inches||0);
Animal.dietComperator = (animal1, animal2) => Animal.DIET_ENUM[animal1.diet.toLowerCase()] - Animal.DIET_ENUM[animal2.diet.toLowerCase()];