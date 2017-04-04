(function () {
'use strict';

function appendNode ( node, target ) {
	target.appendChild( node );
}

function insertNode ( node, target, anchor ) {
	target.insertBefore( node, anchor );
}

function detachNode ( node ) {
	node.parentNode.removeChild( node );
}

function teardownEach ( iterations, detach, start ) {
	for ( var i = ( start || 0 ); i < iterations.length; i += 1 ) {
		iterations[i].teardown( detach );
	}
}

function createElement ( name ) {
	return document.createElement( name );
}

function createText ( data ) {
	return document.createTextNode( data );
}

function createComment () {
	return document.createComment( '' );
}

function addEventListener ( node, event, handler ) {
	node.addEventListener ( event, handler, false );
}

function removeEventListener ( node, event, handler ) {
	node.removeEventListener ( event, handler, false );
}

function get ( key ) {
	return key ? this._state[ key ] : this._state;
}

function fire ( eventName, data ) {
	var handlers = eventName in this._handlers && this._handlers[ eventName ].slice();
	if ( !handlers ) return;

	for ( var i = 0; i < handlers.length; i += 1 ) {
		handlers[i].call( this, data );
	}
}

function observe ( key, callback, options ) {
	var group = ( options && options.defer ) ? this._observers.pre : this._observers.post;

	( group[ key ] || ( group[ key ] = [] ) ).push( callback );

	if ( !options || options.init !== false ) {
		callback.__calling = true;
		callback.call( this, this._state[ key ] );
		callback.__calling = false;
	}

	return {
		cancel: function () {
			var index = group[ key ].indexOf( callback );
			if ( ~index ) group[ key ].splice( index, 1 );
		}
	};
}

function on ( eventName, handler ) {
	if ( eventName === 'teardown' ) return this.on( 'destroy', handler );

	var handlers = this._handlers[ eventName ] || ( this._handlers[ eventName ] = [] );
	handlers.push( handler );

	return {
		cancel: function () {
			var index = handlers.indexOf( handler );
			if ( ~index ) handlers.splice( index, 1 );
		}
	};
}

function set ( newState ) {
	this._set( newState );
	( this._root || this )._flush();
}

function _flush () {
	if ( !this._renderHooks ) return;

	while ( this._renderHooks.length ) {
		var hook = this._renderHooks.pop();
		hook.fn.call( hook.context );
	}
}

var proto = {
	get: get,
	fire: fire,
	observe: observe,
	on: on,
	set: set,
	_flush: _flush
};

function noop () {}

function assign ( target ) {
	for ( var i = 1; i < arguments.length; i += 1 ) {
		var source = arguments[i];
		for ( var k in source ) target[k] = source[k];
	}

	return target;
}

function differs ( a, b ) {
	return ( a !== b ) || ( a && ( typeof a === 'object' ) || ( typeof a === 'function' ) );
}

function dispatchObservers ( component, group, newState, oldState ) {
	for ( var key in group ) {
		if ( !( key in newState ) ) continue;

		var newValue = newState[ key ];
		var oldValue = oldState[ key ];

		if ( newValue === oldValue && typeof newValue !== 'object' ) continue;

		var callbacks = group[ key ];
		if ( !callbacks ) continue;

		for ( var i = 0; i < callbacks.length; i += 1 ) {
			var callback = callbacks[i];
			if ( callback.__calling ) continue;

			callback.__calling = true;
			callback.call( component, newValue, oldValue );
			callback.__calling = false;
		}
	}
}

function recompute ( state, newState, oldState, isInitial ) {
	if ( isInitial || ( 'items' in newState && differs( state.items, oldState.items ) ) ) {
		state.numActive = newState.numActive = template.computed.numActive( state.items );
	}
	
	if ( isInitial || ( 'items' in newState && differs( state.items, oldState.items ) ) ) {
		state.numCompleted = newState.numCompleted = template.computed.numCompleted( state.items );
	}
}

var template = (function () {
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

	return {
		data: () => ({
			currentFilter: 'all',
			items
		}),

		computed: {
			numActive: items => items.filter( item => !item.completed ).length,
			numCompleted: items => items.filter( item => item.completed ).length
		},

		helpers: {
			filter ( item, currentFilter ) {
				if ( currentFilter === 'all' ) return true;
				if ( currentFilter === 'completed' ) return item.completed;
				if ( currentFilter === 'active' ) return !item.completed;
			}
		},

		oncreate () {
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
}());

function render_main_fragment ( root, component ) {
	var header = createElement( 'header' );
	header.className = "header";
	
	var h1 = createElement( 'h1' );
	
	appendNode( h1, header );
	appendNode( createText( "todos" ), h1 );
	appendNode( createText( "\n\t" ), header );
	
	var input = createElement( 'input' );
	component.refs.newTodo = input;
	input.className = "new-todo";
	
	var enter_handler = template.events.enter.call( component, input, function ( event ) {
		component.newTodo(this.value);
	}.bind( input ) );
	
	input.placeholder = "What needs to be done?";
	input.autofocus = true;
	
	appendNode( input, header );
	var text_2 = createText( "\n\n" );
	var if_block_anchor = createComment();
	
	function get_block ( root ) {
		if ( root.items.length > 0 ) return render_if_block_0;
		return null;
	}
	
	var current_block = get_block( root );
	var if_block = current_block && current_block( root, component );

	return {
		mount: function ( target, anchor ) {
			insertNode( header, target, anchor );
			insertNode( text_2, target, anchor );
			insertNode( if_block_anchor, target, anchor );
			if ( if_block ) if_block.mount( if_block_anchor.parentNode, if_block_anchor );
		},
		
		update: function ( changed, root ) {
			
		
			var _current_block = current_block;
			current_block = get_block( root );
			if ( _current_block === current_block && if_block) {
				if_block.update( changed, root );
			} else {
				if ( if_block ) if_block.teardown( true );
				if_block = current_block && current_block( root, component );
				if ( if_block ) if_block.mount( if_block_anchor.parentNode, if_block_anchor );
			}
		},
		
		teardown: function ( detach ) {
			if ( component.refs.newTodo === input ) component.refs.newTodo = null;
			enter_handler.teardown();
			if ( if_block ) if_block.teardown( detach );
			
			if ( detach ) {
				detachNode( header );
				detachNode( text_2 );
				detachNode( if_block_anchor );
			}
		}
	};
}

function render_if_block_0 ( root, component ) {
	var section = createElement( 'section' );
	section.className = "main";
	
	var input = createElement( 'input' );
	input.className = "toggle-all";
	input.type = "checkbox";
	
	function change_handler ( event ) {
		component.toggleAll(this.checked);
	}
	
	addEventListener( input, 'change', change_handler );
	
	var last_input_checked = root.numCompleted === root.items.length;
	input.checked = last_input_checked;
	
	appendNode( input, section );
	appendNode( createText( "\n\t\t" ), section );
	
	var label = createElement( 'label' );
	label.htmlFor = "toggle-all";
	
	appendNode( label, section );
	appendNode( createText( "Mark all as complete" ), label );
	appendNode( createText( "\n\n\t\t" ), section );
	
	var ul = createElement( 'ul' );
	ul.className = "todo-list";
	
	appendNode( ul, section );
	var each_block_anchor = createComment();
	appendNode( each_block_anchor, ul );
	var each_block_value = root.items;
	var each_block_iterations = [];
	
	for ( var i = 0; i < each_block_value.length; i += 1 ) {
		each_block_iterations[i] = render_each_block( root, each_block_value, each_block_value[i], i, component );
		each_block_iterations[i].mount( each_block_anchor.parentNode, each_block_anchor );
	}
	
	appendNode( createText( "\n\n\t\t" ), section );
	
	var footer = createElement( 'footer' );
	footer.className = "footer";
	
	appendNode( footer, section );
	
	var span = createElement( 'span' );
	span.className = "todo-count";
	
	appendNode( span, footer );
	
	var strong = createElement( 'strong' );
	
	appendNode( strong, span );
	var last_text_4 = root.numActive;
	var text_4 = createText( last_text_4 );
	appendNode( text_4, strong );
	appendNode( createText( " " ), span );
	var last_text_6 = root.numActive === 1 ? 'item' : 'items';
	var text_6 = createText( last_text_6 );
	appendNode( text_6, span );
	appendNode( createText( " left" ), span );
	appendNode( createText( "\n\n\t\t\t" ), footer );
	
	var ul_1 = createElement( 'ul' );
	ul_1.className = "filters";
	
	appendNode( ul_1, footer );
	
	var li = createElement( 'li' );
	
	appendNode( li, ul_1 );
	
	var a = createElement( 'a' );
	var last_a_class = root.currentFilter === 'all' ? 'selected' : '';
	a.className = last_a_class;
	a.href = "#/";
	
	appendNode( a, li );
	appendNode( createText( "All" ), a );
	appendNode( createText( "\n\t\t\t\t" ), ul_1 );
	
	var li_1 = createElement( 'li' );
	
	appendNode( li_1, ul_1 );
	
	var a_1 = createElement( 'a' );
	var last_a_1_class = root.currentFilter === 'active' ? 'selected' : '';
	a_1.className = last_a_1_class;
	a_1.href = "#/active";
	
	appendNode( a_1, li_1 );
	appendNode( createText( "Active" ), a_1 );
	appendNode( createText( "\n\t\t\t\t" ), ul_1 );
	
	var li_2 = createElement( 'li' );
	
	appendNode( li_2, ul_1 );
	
	var a_2 = createElement( 'a' );
	var last_a_2_class = root.currentFilter === 'completed' ? 'selected' : '';
	a_2.className = last_a_2_class;
	a_2.href = "#/completed";
	
	appendNode( a_2, li_2 );
	appendNode( createText( "Completed" ), a_2 );
	appendNode( createText( "\n\n\t\t\t" ), footer );
	var if_block_3_anchor = createComment();
	appendNode( if_block_3_anchor, footer );
	
	function get_block ( root ) {
		if ( root.numCompleted ) return render_if_block_3_0;
		return null;
	}
	
	var current_block = get_block( root );
	var if_block_3 = current_block && current_block( root, component );
	
	if ( if_block_3 ) if_block_3.mount( if_block_3_anchor.parentNode, if_block_3_anchor );

	return {
		mount: function ( target, anchor ) {
			insertNode( section, target, anchor );
		},
		
		update: function ( changed, root ) {
			var tmp;
		
			if ( ( tmp = root.numCompleted === root.items.length ) !== last_input_checked ) {
				last_input_checked = tmp;
				input.checked = last_input_checked;
			}
			
			var each_block_value = root.items;
			
			for ( var i = 0; i < each_block_value.length; i += 1 ) {
				if ( !each_block_iterations[i] ) {
					each_block_iterations[i] = render_each_block( root, each_block_value, each_block_value[i], i, component );
					each_block_iterations[i].mount( each_block_anchor.parentNode, each_block_anchor );
				} else {
					each_block_iterations[i].update( changed, root, each_block_value, each_block_value[i], i );
				}
			}
			
			teardownEach( each_block_iterations, true, each_block_value.length );
			
			each_block_iterations.length = each_block_value.length;
			
			if ( ( tmp = root.numActive ) !== last_text_4 ) {
				text_4.data = last_text_4 = tmp;
			}
			
			if ( ( tmp = root.numActive === 1 ? 'item' : 'items' ) !== last_text_6 ) {
				text_6.data = last_text_6 = tmp;
			}
			
			if ( ( tmp = root.currentFilter === 'all' ? 'selected' : '' ) !== last_a_class ) {
				last_a_class = tmp;
				a.className = last_a_class;
			}
			
			if ( ( tmp = root.currentFilter === 'active' ? 'selected' : '' ) !== last_a_1_class ) {
				last_a_1_class = tmp;
				a_1.className = last_a_1_class;
			}
			
			if ( ( tmp = root.currentFilter === 'completed' ? 'selected' : '' ) !== last_a_2_class ) {
				last_a_2_class = tmp;
				a_2.className = last_a_2_class;
			}
			
			var _current_block = current_block;
			current_block = get_block( root );
			if ( _current_block === current_block && if_block_3) {
				if_block_3.update( changed, root );
			} else {
				if ( if_block_3 ) if_block_3.teardown( true );
				if_block_3 = current_block && current_block( root, component );
				if ( if_block_3 ) if_block_3.mount( if_block_3_anchor.parentNode, if_block_3_anchor );
			}
		},
		
		teardown: function ( detach ) {
			removeEventListener( input, 'change', change_handler );
			
			teardownEach( each_block_iterations, false );
			
			if ( if_block_3 ) if_block_3.teardown( false );
			
			if ( detach ) {
				detachNode( section );
			}
		}
	};
}

function render_if_block_3_0 ( root, component ) {
	var button = createElement( 'button' );
	button.className = "clear-completed";
	
	function click_handler ( event ) {
		component.clearCompleted();
	}
	
	addEventListener( button, 'click', click_handler );
	
	appendNode( createText( "Clear completed" ), button );

	return {
		mount: function ( target, anchor ) {
			insertNode( button, target, anchor );
		},
		
		update: noop,
		
		teardown: function ( detach ) {
			removeEventListener( button, 'click', click_handler );
			
			if ( detach ) {
				detachNode( button );
			}
		}
	};
}

function render_each_block ( root, each_block_value, item, index, component ) {
	var if_block_1_anchor = createComment();
	
	function get_block ( root, each_block_value, item, index ) {
		if ( template.helpers.filter(item, root.currentFilter) ) return render_if_block_1_0;
		return null;
	}
	
	var current_block = get_block( root, each_block_value, item, index );
	var if_block_1 = current_block && current_block( root, each_block_value, item, index, component );

	return {
		mount: function ( target, anchor ) {
			insertNode( if_block_1_anchor, target, anchor );
			if ( if_block_1 ) if_block_1.mount( if_block_1_anchor.parentNode, if_block_1_anchor );
		},
		
		update: function ( changed, root, each_block_value, item, index ) {
			
		
			var _current_block = current_block;
			current_block = get_block( root, each_block_value, item, index );
			if ( _current_block === current_block && if_block_1) {
				if_block_1.update( changed, root, each_block_value, item, index );
			} else {
				if ( if_block_1 ) if_block_1.teardown( true );
				if_block_1 = current_block && current_block( root, each_block_value, item, index, component );
				if ( if_block_1 ) if_block_1.mount( if_block_1_anchor.parentNode, if_block_1_anchor );
			}
		},
		
		teardown: function ( detach ) {
			if ( if_block_1 ) if_block_1.teardown( detach );
			
			if ( detach ) {
				detachNode( if_block_1_anchor );
			}
		}
	};
}

function render_if_block_1_0 ( root, each_block_value, item, index, component ) {
	var li = createElement( 'li' );
	li.className = "" + ( item.completed ? 'completed' : '' ) + " " + ( root.editing === index ? 'editing' : '' );
	
	var div = createElement( 'div' );
	div.className = "view";
	
	appendNode( div, li );
	
	var input = createElement( 'input' );
	input.className = "toggle";
	input.type = "checkbox";
	
	var input_updating = false;
	
	function input_change_handler () {
		input_updating = true;
		var list = this.__svelte.each_block_value;
		var index = this.__svelte.index;
		list[index].completed = input.checked;
		
		component._set({ items: component.get( 'items' ) });
		input_updating = false;
	}
	
	addEventListener( input, 'change', input_change_handler );
	
	input.__svelte = {
		each_block_value: each_block_value,
		index: index
	};
	
	appendNode( input, div );
	
	input.checked = item.completed;
	
	appendNode( createText( "\n\t\t\t\t\t\t\t" ), div );
	
	var label = createElement( 'label' );
	
	function dblclick_handler ( event ) {
		var each_block_value = this.__svelte.each_block_value, index = this.__svelte.index, item = each_block_value[index];
		
		component.edit(index);
	}
	
	addEventListener( label, 'dblclick', dblclick_handler );
	
	label.__svelte = {
		each_block_value: each_block_value,
		index: index
	};
	
	appendNode( label, div );
	var last_text_1 = item.description;
	var text_1 = createText( last_text_1 );
	appendNode( text_1, label );
	appendNode( createText( "\n\t\t\t\t\t\t\t" ), div );
	
	var button = createElement( 'button' );
	
	function click_handler ( event ) {
		var each_block_value = this.__svelte.each_block_value, index = this.__svelte.index, item = each_block_value[index];
		
		component.remove(index);
	}
	
	addEventListener( button, 'click', click_handler );
	
	button.className = "destroy";
	
	button.__svelte = {
		each_block_value: each_block_value,
		index: index
	};
	
	appendNode( button, div );
	appendNode( createText( "\n\n\t\t\t\t\t\t" ), li );
	var if_block_2_anchor = createComment();
	appendNode( if_block_2_anchor, li );
	
	function get_block ( root, each_block_value, item, index ) {
		if ( root.editing === index ) return render_if_block_2_0;
		return null;
	}
	
	var current_block = get_block( root, each_block_value, item, index );
	var if_block_2 = current_block && current_block( root, each_block_value, item, index, component );
	
	if ( if_block_2 ) if_block_2.mount( if_block_2_anchor.parentNode, if_block_2_anchor );

	return {
		mount: function ( target, anchor ) {
			insertNode( li, target, anchor );
		},
		
		update: function ( changed, root, each_block_value, item, index ) {
			var tmp;
		
			li.className = "" + ( item.completed ? 'completed' : '' ) + " " + ( root.editing === index ? 'editing' : '' );
			
			if ( !input_updating ) {
				input.checked = item.completed;
			}
			
			input.__svelte.each_block_value = each_block_value;
			input.__svelte.index = index;
			
			label.__svelte.each_block_value = each_block_value;
			label.__svelte.index = index;
			
			if ( ( tmp = item.description ) !== last_text_1 ) {
				text_1.data = last_text_1 = tmp;
			}
			
			button.__svelte.each_block_value = each_block_value;
			button.__svelte.index = index;
			
			var _current_block = current_block;
			current_block = get_block( root, each_block_value, item, index );
			if ( _current_block === current_block && if_block_2) {
				if_block_2.update( changed, root, each_block_value, item, index );
			} else {
				if ( if_block_2 ) if_block_2.teardown( true );
				if_block_2 = current_block && current_block( root, each_block_value, item, index, component );
				if ( if_block_2 ) if_block_2.mount( if_block_2_anchor.parentNode, if_block_2_anchor );
			}
		},
		
		teardown: function ( detach ) {
			removeEventListener( input, 'change', input_change_handler );
			removeEventListener( label, 'dblclick', dblclick_handler );
			removeEventListener( button, 'click', click_handler );
			if ( if_block_2 ) if_block_2.teardown( false );
			
			if ( detach ) {
				detachNode( li );
			}
		}
	};
}

function render_if_block_2_0 ( root, each_block_value, item, index, component ) {
	var input = createElement( 'input' );
	var last_input_value = item.description;
	input.value = last_input_value;
	input.id = "edit";
	input.className = "edit";
	
	var enter_handler = template.events.enter.call( component, input, function ( event ) {
		component.blur(this);
	}.bind( input ) );
	
	function blur_handler ( event ) {
		component.submit(this.value);
	}
	
	addEventListener( input, 'blur', blur_handler );
	
	var escape_handler = template.events.escape.call( component, input, function ( event ) {
		component.cancel();
	}.bind( input ) );
	
	input.autofocus = true;
	
	input.focus();

	return {
		mount: function ( target, anchor ) {
			insertNode( input, target, anchor );
		},
		
		update: function ( changed, root, each_block_value, item, index ) {
			var tmp;
		
			if ( ( tmp = item.description ) !== last_input_value ) {
				last_input_value = tmp;
				input.value = last_input_value;
			}
		},
		
		teardown: function ( detach ) {
			enter_handler.teardown();
			removeEventListener( input, 'blur', blur_handler );
			escape_handler.teardown();
			
			if ( detach ) {
				detachNode( input );
			}
		}
	};
}

function TodoMVC ( options ) {
	options = options || {};
	this.refs = {};
	this._state = assign( template.data(), options.data );
	recompute( this._state, this._state, {}, true );
	
	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};
	
	this._handlers = Object.create( null );
	
	this._root = options._root;
	this._yield = options._yield;
	
	this._torndown = false;
	
	this._fragment = render_main_fragment( this._state, this );
	if ( options.target ) this._fragment.mount( options.target, null );
	
	if ( options._root ) {
		options._root._renderHooks.push({ fn: template.oncreate, context: this });
	} else {
		template.oncreate.call( this );
	}
}

assign( TodoMVC.prototype, template.methods, proto );

TodoMVC.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = assign( {}, oldState, newState );
	recompute( this._state, newState, oldState, false );
	
	dispatchObservers( this, this._observers.pre, newState, oldState );
	if ( this._fragment ) this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
};

TodoMVC.prototype.teardown = TodoMVC.prototype.destroy = function destroy ( detach ) {
	this.fire( 'destroy' );

	this._fragment.teardown( detach !== false );
	this._fragment = null;

	this._state = {};
	this._torndown = true;
};

window.todomvc = new TodoMVC({
	target: document.querySelector( '.todoapp' )
});

}());
//# sourceMappingURL=bundle.js.map
