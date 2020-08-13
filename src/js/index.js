import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/serachView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

const state = {};

/**
 * Search controller
 */
const controlSearch = async () => {
    // 1) Get qeury from view
    const query = searchView.getInput(); //Todo
    

    if(query) {
        // 2) New search objext and add to state
        state.search = new Search(query);

        // 3) Prepare UI results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try {
            // 4) Search for recipes
            await state.search.getResults();
    
            // 5) Render results on UI
            clearLoader();
            searchView.renderResult(state.search.result);

        } catch (error) {
            alert('Error with searching!');
        };
        
    }
}


elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
})

elements.searchResPages.addEventListener('click', e =>{
    const btn = e.target.closest('.btn-inline');
    if(btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResult(state.search.result, goToPage);
    }

})


/**
 * Recipe controller
 */
const controlRecipe = async () => {
    //Get ID from url
    const id = window.location.hash.replace('#', '');
    

    if(id) {
        //Prepare UI for recipe
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //Highlight selected search item
        if(state.search) searchView.highlightSelected(id);

        //Create new recipe object
        state.recipe = new Recipe(id);

        try {
            //Get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
            //Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
    
            //Render recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));

        } catch(error) {
            alert('Error processing recipe');
        }
    }
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));


/**
 * List controller
 */
const controlList = () => {
    //Create a list If there in none yet
    if (!state.list) state.list = new List();

    //Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item); 
    })
}

//Handle delete item and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;


    //Handle delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        //Delete from state
        state.list.deleteItem(id);
        //Delete from UI
        listView.deleteItem(id);

    //Handle count update    
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.undateCount(id, val);
    }
})



/**
 * Like controller
 */
const controlLike = () => {
    if (!state.likes) state.likes = new Likes()
    const currentId = state.recipe.id;

    //User has Not yet liked the post
    if(!state.likes.isLiked(currentId)) {
        //Add to likes list
        const newLike = state.likes.addLike(
            currentId,
            state.recipe.img,
            state.recipe.title,
            state.recipe.author
        )
        //Toggle like button
        likesView.toggleLikeBtn(true);    
        //Add to UI list
        likesView.renderLike(newLike)
    //User HAS liked the post
    } else {
        //Remove from likes list
        state.likes.deleteLike(currentId);
        //Toggle like button
        likesView.toggleLikeBtn(false);
        //Remove from UI list
        likesView.deleteLike(currentId);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
}

//Restore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();

    //Restore likes from local storage
    state.likes.readStorage();

    //Toggle like munu 
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    //Rendor existing menu
    state.likes.likes.forEach(like => likesView.renderLike(like));
    
})

//Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *')) {
        //Decrease button is clicked
        if (state.recipe.servings > 1){
            state.recipe.updateServings('dec');
            recipeView.undateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        //Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.undateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        //Add ingredients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        //Like controller
        controlLike();
    }
})

