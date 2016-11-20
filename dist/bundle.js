(function () {
'use strict';

const ENTER_KEY = 13;
	const ESCAPE_KEY = 27;

	function keyEvent ( code ) {
		return function ( node, callback ) {
			function keydownHandler ( event ) {
				if ( event.which === code ) callback.call( this, event );
			}

			node.addEventListener( 'keydown', keydownHandler, false );

			return {
				teardown () {
					node.removeEventListener( 'keydown', keydownHandler, false );
				}
			};
		};
	}

	let items;
	try {
		items = JSON.parse( localStorage.getItem( 'todos-svelte' ) ) || [];
	} catch ( err ) {
		items = [];
	}

	const template = {
		data: () => ({
			currentFilter: 'all',
			items
		}),

		computed: {
			numActive ( items ) {
				return items.filter( item => !item.completed ).length;
			},

			numCompleted ( items ) {
				return items.filter( item => item.completed ).length;
			}
		},

		helpers: {
			filter ( item, currentFilter ) {
				if ( currentFilter === 'all' ) return true;
				if ( currentFilter === 'completed' ) return item.completed;
				if ( currentFilter === 'active' ) return !item.completed;
			}
		},

		onrender () {
			const updateView = () => {
				let currentFilter = 'all';
				if ( window.location.hash === '#/active' ) {
					currentFilter = 'active';
				} else if ( window.location.hash === '#/completed' ) {
					currentFilter = 'completed';
				}

				this.set({ currentFilter });
			};

			window.addEventListener( 'hashchange', updateView );
			updateView();

			this.observe( 'items', items => {
				try {
					localStorage.setItem( 'todos-svelte', JSON.stringify( items ) );
				} catch ( err ) {
					// noop
				}
			});
		},

		methods: {
			blur ( node ) {
				node.blur();
			},

			cancel () {
				this.set({ editing: null });
			},

			clearCompleted () {
				const items = this.get( 'items' ).filter( item => !item.completed );
				this.set({ items });
			},

			edit ( index ) {
				this.set({ editing: index });
			},

			newTodo ( description ) {
				const items = this.get( 'items' );
				items.push({
					description,
					completed: false
				});

				this.set({ items });
				this.refs.newTodo.value = '';
			},

			remove ( index ) {
				const items = this.get( 'items' );
				items.splice( index, 1 );

				this.set({ items });
			},

			submit ( description ) {
				const items = this.get( 'items' );
				const index = this.get( 'editing' );

				items[ index ].description = description;

				this.set({ items, editing: null });
			},

			toggleAll ( checked ) {
				const items = this.get( 'items' );

				items.forEach( item => {
					item.completed = checked;
				});

				this.set({ items });
			}
		},

		events: {
			enter: keyEvent( ENTER_KEY ),
			escape: keyEvent( ESCAPE_KEY )
		}
	};

function renderMainFragment ( component, target ) {
	var header = document.createElement( 'header' );
	header.className = "header";
	
	var h1 = document.createElement( 'h1' );
	
	h1.appendChild( document.createTextNode( "todos" ) );
	
	header.appendChild( h1 );
	
	header.appendChild( document.createTextNode( "\n\t" ) );
	
	var input = document.createElement( 'input' );
	component.refs.newTodo = input;
	input.className = "new-todo";
	const enterHandler = template.events.enter( input, function ( event ) {
		component.newTodo(this.value);
	});
	input.placeholder = "What needs to be done?";
	input.autofocus = true;
	
	header.appendChild( input );
	
	target.appendChild( header );
	
	target.appendChild( document.createTextNode( "\n\n" ) );
	
	var ifBlock_0_anchor = document.createComment( "#if items.length > 0" );
	target.appendChild( ifBlock_0_anchor );
	var ifBlock_0 = null;

	return {
		update: function ( root ) {
			var ifBlock_0_value = root.items.length > 0;
			
			if ( ifBlock_0_value && !ifBlock_0 ) {
				ifBlock_0 = renderIfBlock_0( component, target, ifBlock_0_anchor );
			}
			
			else if ( !ifBlock_0_value && ifBlock_0 ) {
				ifBlock_0.teardown();
				ifBlock_0 = null;
			}
			
			if ( ifBlock_0 ) {
				ifBlock_0.update( root );
			}
		},

		teardown: function () {
			header.parentNode.removeChild( header );
			
			h1.parentNode.removeChild( h1 );
			
			component.refs.newTodo = null;
			enterHandler.teardown();
			input.parentNode.removeChild( input );
			
			if ( ifBlock_0 ) ifBlock_0.teardown();
			ifBlock_0_anchor.parentNode.removeChild( ifBlock_0_anchor );
		}
	};
}

function renderIfBlock_0 ( component, target, anchor ) {
	var section = document.createElement( 'section' );
	section.className = "main";
	
	var input = document.createElement( 'input' );
	input.className = "toggle-all";
	input.type = "checkbox";
	function changeHandler ( event ) {
		component.toggleAll(this.checked);
	}
	
	input.addEventListener( 'change', changeHandler, false );
	
	section.appendChild( input );
	
	section.appendChild( document.createTextNode( "\n\t\t" ) );
	
	var label = document.createElement( 'label' );
	label.htmlFor = "toggle-all";
	
	label.appendChild( document.createTextNode( "Mark all as complete" ) );
	
	section.appendChild( label );
	
	section.appendChild( document.createTextNode( "\n\n\t\t" ) );
	
	var ul = document.createElement( 'ul' );
	ul.className = "todo-list";
	
	var eachBlock_0_anchor = document.createComment( "#each items" );
	ul.appendChild( eachBlock_0_anchor );
	var eachBlock_0_iterations = [];
	const eachBlock_0_fragment = document.createDocumentFragment();
	
	section.appendChild( ul );
	
	section.appendChild( document.createTextNode( "\n\n\t\t" ) );
	
	var footer = document.createElement( 'footer' );
	footer.className = "footer";
	
	var span = document.createElement( 'span' );
	span.className = "todo-count";
	
	var strong = document.createElement( 'strong' );
	
	var text = document.createTextNode( '' );
	var text_value = '';
	strong.appendChild( text );
	
	span.appendChild( strong );
	
	span.appendChild( document.createTextNode( " " ) );
	
	var text1 = document.createTextNode( '' );
	var text1_value = '';
	span.appendChild( text1 );
	
	span.appendChild( document.createTextNode( " left" ) );
	
	footer.appendChild( span );
	
	footer.appendChild( document.createTextNode( "\n\n\t\t\t" ) );
	
	var ul1 = document.createElement( 'ul' );
	ul1.className = "filters";
	
	var li = document.createElement( 'li' );
	
	var a = document.createElement( 'a' );
	a.href = "#/";
	
	a.appendChild( document.createTextNode( "All" ) );
	
	li.appendChild( a );
	
	ul1.appendChild( li );
	
	ul1.appendChild( document.createTextNode( "\n\t\t\t\t" ) );
	
	var li1 = document.createElement( 'li' );
	
	var a1 = document.createElement( 'a' );
	a1.href = "#/active";
	
	a1.appendChild( document.createTextNode( "Active" ) );
	
	li1.appendChild( a1 );
	
	ul1.appendChild( li1 );
	
	ul1.appendChild( document.createTextNode( "\n\t\t\t\t" ) );
	
	var li2 = document.createElement( 'li' );
	
	var a2 = document.createElement( 'a' );
	a2.href = "#/completed";
	
	a2.appendChild( document.createTextNode( "Completed" ) );
	
	li2.appendChild( a2 );
	
	ul1.appendChild( li2 );
	
	footer.appendChild( ul1 );
	
	footer.appendChild( document.createTextNode( "\n\n\t\t\t" ) );
	
	var ifBlock_3_anchor = document.createComment( "#if numCompleted" );
	footer.appendChild( ifBlock_3_anchor );
	var ifBlock_3 = null;
	
	section.appendChild( footer );
	
	anchor.parentNode.insertBefore( section, anchor );

	return {
		update: function ( root ) {
			input.checked = root.numCompleted === root.items.length;
			
			var eachBlock_0_value = root.items;
			
			for ( var i = 0; i < eachBlock_0_value.length; i += 1 ) {
				if ( !eachBlock_0_iterations[i] ) {
					eachBlock_0_iterations[i] = renderEachBlock_0( component, eachBlock_0_fragment );
				}
			
				const iteration = eachBlock_0_iterations[i];
				eachBlock_0_iterations[i].update( root, eachBlock_0_value, eachBlock_0_value[i], i );
			}
			
			for ( var i = eachBlock_0_value.length; i < eachBlock_0_iterations.length; i += 1 ) {
				eachBlock_0_iterations[i].teardown();
			}
			
			eachBlock_0_anchor.parentNode.insertBefore( eachBlock_0_fragment, eachBlock_0_anchor );
			eachBlock_0_iterations.length = eachBlock_0_value.length;
			
			if ( root.numActive !== text_value ) {
				text_value = root.numActive;
				text.data = text_value;
			}
			
			var temp = root.numActive === 1 ? 'item' : 'items';
			if ( temp !== text1_value ) {
				text1_value = temp;
				text1.data = text1_value;
			}
			
			a.className = root.currentFilter === 'all' ? 'selected' : '';
			
			a1.className = root.currentFilter === 'active' ? 'selected' : '';
			
			a2.className = root.currentFilter === 'completed' ? 'selected' : '';
			
			if ( root.numCompleted && !ifBlock_3 ) {
				ifBlock_3 = renderIfBlock_3( component, footer, ifBlock_3_anchor );
			}
			
			else if ( !root.numCompleted && ifBlock_3 ) {
				ifBlock_3.teardown();
				ifBlock_3 = null;
			}
			
			if ( ifBlock_3 ) {
				ifBlock_3.update( root );
			}
		},

		teardown: function () {
			section.parentNode.removeChild( section );
			
			input.removeEventListener( 'change', changeHandler, false );
			input.parentNode.removeChild( input );
			
			label.parentNode.removeChild( label );
			
			ul.parentNode.removeChild( ul );
			
			for ( let i = 0; i < eachBlock_0_iterations.length; i += 1 ) {
				eachBlock_0_iterations[i].teardown();
			}
			
			eachBlock_0_anchor.parentNode.removeChild( eachBlock_0_anchor );
			
			footer.parentNode.removeChild( footer );
			
			span.parentNode.removeChild( span );
			
			strong.parentNode.removeChild( strong );
			
			ul1.parentNode.removeChild( ul1 );
			
			li.parentNode.removeChild( li );
			
			a.parentNode.removeChild( a );
			
			li1.parentNode.removeChild( li1 );
			
			a1.parentNode.removeChild( a1 );
			
			li2.parentNode.removeChild( li2 );
			
			a2.parentNode.removeChild( a2 );
			
			if ( ifBlock_3 ) ifBlock_3.teardown();
			ifBlock_3_anchor.parentNode.removeChild( ifBlock_3_anchor );
		}
	};
}

function renderIfBlock_3 ( component, target, anchor ) {
	var button = document.createElement( 'button' );
	button.className = "clear-completed";
	function clickHandler ( event ) {
		component.clearCompleted();
	}
	
	button.addEventListener( 'click', clickHandler, false );
	
	button.appendChild( document.createTextNode( "Clear completed" ) );
	
	anchor.parentNode.insertBefore( button, anchor );

	return {
		update: function ( root ) {
			
		},

		teardown: function () {
			button.removeEventListener( 'click', clickHandler, false );
			button.parentNode.removeChild( button );
		}
	};
}

function renderEachBlock_0 ( component, target ) {
	var ifBlock_1_anchor = document.createComment( "#if filter(item, currentFilter)" );
	target.appendChild( ifBlock_1_anchor );
	var ifBlock_1 = null;

	return {
		update: function ( root, eachBlock_0_value, item, index ) {
			var item = eachBlock_0_value[index];
			
			var ifBlock_1_value = template.helpers.filter(item, root.currentFilter);
			
			if ( ifBlock_1_value && !ifBlock_1 ) {
				ifBlock_1 = renderIfBlock_1( component, target, ifBlock_1_anchor );
			}
			
			else if ( !ifBlock_1_value && ifBlock_1 ) {
				ifBlock_1.teardown();
				ifBlock_1 = null;
			}
			
			if ( ifBlock_1 ) {
				ifBlock_1.update( root, eachBlock_0_value, item, index );
			}
		},

		teardown: function () {
			if ( ifBlock_1 ) ifBlock_1.teardown();
			ifBlock_1_anchor.parentNode.removeChild( ifBlock_1_anchor );
		}
	};
}

function renderIfBlock_1 ( component, target, anchor ) {
	var li = document.createElement( 'li' );
	
	var div = document.createElement( 'div' );
	div.className = "view";
	
	var input = document.createElement( 'input' );
	input.className = "toggle";
	input.type = "checkbox";
	var input_updating = false;
	
	function inputChangeHandler () {
		input_updating = true;
		var list = this.__svelte.eachBlock_0_value;
		var index = this.__svelte.index;
		list[index].completed = this.checked;
		
		component.set({ items: component.get( 'items' ) });
		input_updating = false;
	}
	
	input.addEventListener( 'change', inputChangeHandler, false );
	input.__svelte = {};
	
	div.appendChild( input );
	
	div.appendChild( document.createTextNode( "\n\t\t\t\t\t\t\t" ) );
	
	var label = document.createElement( 'label' );
	function dblclickHandler ( event ) {
		var eachBlock_0_value = this.__svelte.eachBlock_0_value, index = this.__svelte.index, item = eachBlock_0_value[index];
		
		component.edit(index);
	}
	
	label.addEventListener( 'dblclick', dblclickHandler, false );
	label.__svelte = {};
	
	var text = document.createTextNode( '' );
	var text_value = '';
	label.appendChild( text );
	
	div.appendChild( label );
	
	div.appendChild( document.createTextNode( "\n\t\t\t\t\t\t\t" ) );
	
	var button = document.createElement( 'button' );
	function clickHandler ( event ) {
		var eachBlock_0_value = this.__svelte.eachBlock_0_value, index = this.__svelte.index, item = eachBlock_0_value[index];
		
		component.remove(index);
	}
	
	button.addEventListener( 'click', clickHandler, false );
	button.className = "destroy";
	button.__svelte = {};
	
	div.appendChild( button );
	
	li.appendChild( div );
	
	li.appendChild( document.createTextNode( "\n\n\t\t\t\t\t\t" ) );
	
	var ifBlock_2_anchor = document.createComment( "#if editing === index" );
	li.appendChild( ifBlock_2_anchor );
	var ifBlock_2 = null;
	
	anchor.parentNode.insertBefore( li, anchor );

	return {
		update: function ( root, eachBlock_0_value, item, index ) {
			li.className = "" + ( item.completed ? 'completed' : '' ) + " " + ( root.editing === index ? 'editing' : '' );
			
			if ( !input_updating ) input.checked = item.completed;
			input.__svelte.eachBlock_0_value = eachBlock_0_value;
			input.__svelte.index = index;
			
			label.__svelte.eachBlock_0_value = eachBlock_0_value;
			label.__svelte.index = index;
			
			if ( item.description !== text_value ) {
				text_value = item.description;
				text.data = text_value;
			}
			
			button.__svelte.eachBlock_0_value = eachBlock_0_value;
			button.__svelte.index = index;
			
			var ifBlock_2_value = root.editing === index;
			
			if ( ifBlock_2_value && !ifBlock_2 ) {
				ifBlock_2 = renderIfBlock_2( component, li, ifBlock_2_anchor );
			}
			
			else if ( !ifBlock_2_value && ifBlock_2 ) {
				ifBlock_2.teardown();
				ifBlock_2 = null;
			}
			
			if ( ifBlock_2 ) {
				ifBlock_2.update( root, eachBlock_0_value, item, index );
			}
		},

		teardown: function () {
			li.parentNode.removeChild( li );
			
			div.parentNode.removeChild( div );
			
			input.removeEventListener( 'change', inputChangeHandler, false );
			input.parentNode.removeChild( input );
			
			label.removeEventListener( 'dblclick', dblclickHandler, false );
			label.parentNode.removeChild( label );
			
			button.removeEventListener( 'click', clickHandler, false );
			button.parentNode.removeChild( button );
			
			if ( ifBlock_2 ) ifBlock_2.teardown();
			ifBlock_2_anchor.parentNode.removeChild( ifBlock_2_anchor );
		}
	};
}

function renderIfBlock_2 ( component, target, anchor ) {
	var input = document.createElement( 'input' );
	input.id = "edit";
	input.className = "edit";
	const enterHandler = template.events.enter( input, function ( event ) {
		component.blur(this);
	});
	function blurHandler ( event ) {
		component.submit(this.value);
	}
	
	input.addEventListener( 'blur', blurHandler, false );
	const escapeHandler = template.events.escape( input, function ( event ) {
		component.cancel();
	});
	input.autofocus = true;
	
	anchor.parentNode.insertBefore( input, anchor );
	
	input.focus();

	return {
		update: function ( root, eachBlock_0_value, item, index ) {
			input.value = item.description;
		},

		teardown: function () {
			enterHandler.teardown();
			input.removeEventListener( 'blur', blurHandler, false );
			escapeHandler.teardown();
			input.parentNode.removeChild( input );
		}
	};
}

function createComponent ( options ) {
	var component = Object.create( template.methods );
component.refs = {};
	var state = {};

	var observers = {
		immediate: Object.create( null ),
		deferred: Object.create( null )
	};

	function dispatchObservers ( group, newState, oldState ) {
		for ( const key in group ) {
			if ( !( key in newState ) ) continue;

			const newValue = newState[ key ];
			const oldValue = oldState[ key ];

			if ( newValue === oldValue && typeof newValue !== 'object' ) continue;

			const callbacks = group[ key ];
			if ( !callbacks ) continue;

			for ( let i = 0; i < callbacks.length; i += 1 ) {
				callbacks[i].call( component, newValue, oldValue );
			}
		}
	}

	component.get = function get ( key ) {
		return state[ key ];
	};

	component.set = function set ( newState ) {
		const oldState = state;
		state = Object.assign( {}, oldState, newState );
		
		if ( ( 'items' in newState && typeof state.items === 'object' || state.items !== oldState.items ) ) {
			state.numActive = newState.numActive = template.computed.numActive( state.items );
		}
		
		if ( ( 'items' in newState && typeof state.items === 'object' || state.items !== oldState.items ) ) {
			state.numCompleted = newState.numCompleted = template.computed.numCompleted( state.items );
		}
		
		dispatchObservers( observers.immediate, newState, oldState );
		mainFragment.update( state );
		dispatchObservers( observers.deferred, newState, oldState );
	};

	component.observe = function ( key, callback, options = {} ) {
		const group = options.defer ? observers.deferred : observers.immediate;

		( group[ key ] || ( group[ key ] = [] ) ).push( callback );
		if ( options.init !== false ) callback( state[ key ] );

		return {
			cancel () {
				const index = group[ key ].indexOf( callback );
				if ( ~index ) group[ key ].splice( index, 1 );
			}
		};
	};

	component.teardown = function teardown () {
		mainFragment.teardown();
		mainFragment = null;

		state = {};

		
	};

	let mainFragment = renderMainFragment( component, options.target );
	component.set( Object.assign( template.data(), options.data ) );

	template.onrender.call( component );

	return component;
}

window.todomvc = createComponent({
	target: document.querySelector( '.todoapp' )
});

}());
//# sourceMappingURL=bundle.js.map
