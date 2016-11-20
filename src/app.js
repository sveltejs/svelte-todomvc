import createComponent from './TodoMVC.html';

window.todomvc = createComponent({
	target: document.querySelector( '.todoapp' )
});
