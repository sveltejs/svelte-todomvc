<script>
	import 'todomvc-app-css/index.css';
	import { onMount } from 'svelte';

	const ENTER_KEY = 13;
	const ESCAPE_KEY = 27;

	const active = (item) => !item.completed;
	const completed = (item) => item.completed;

	let currentFilter = 'all';
	let items = [];
	let editing = null;

	try {
		items = JSON.parse(localStorage.getItem('todos-svelte')) || [];
	} catch {
		items = [];
	}

	$: filtered =
		currentFilter === 'all'
			? items
			: items.filter(currentFilter === 'completed' ? completed : active);

	$: numActive = items.filter(active).length;

	$: numCompleted = items.filter(completed).length;

	$: try {
		localStorage.setItem('todos-svelte', JSON.stringify(items));
	} catch {
		// noop
	}

	const updateView = () => {
		currentFilter = 'all';
		if (location.hash === '#/active') {
			currentFilter = 'active';
		} else if (location.hash === '#/completed') {
			currentFilter = 'completed';
		}
	};

	function clearCompleted() {
		items = items.filter(active);
	}

	function remove(index) {
		items = items.slice(0, index).concat(items.slice(index + 1));
	}

	function toggleAll(event) {
		items = items.map((item) => ({
			id: item.id,
			description: item.description,
			completed: event.target.checked
		}));
	}

	function createNew(event) {
		if (event.which === ENTER_KEY) {
			items = items.concat({
				id: crypto.randomUUID(),
				description: event.target.value,
				completed: false
			});
			event.target.value = '';
		}
	}

	function handleEdit(event) {
		if (event.which === ENTER_KEY) event.target.blur();
		else if (event.which === ESCAPE_KEY) editing = null;
	}

	function submit(event) {
		items[editing].description = event.target.value;
		editing = null;
	}

	onMount(updateView);
</script>

<svelte:window on:hashchange={updateView} />

<header class="header">
	<h1>todos</h1>
	<!-- svelte-ignore a11y-autofocus -->
	<input class="new-todo" on:keydown={createNew} placeholder="What needs to be done?" autofocus />
</header>

{#if items.length > 0}
	<section class="main">
		<input
			id="toggle-all"
			class="toggle-all"
			type="checkbox"
			on:change={toggleAll}
			checked={numCompleted === items.length}
		/>
		<label for="toggle-all">Mark all as complete</label>

		<ul class="todo-list">
			{#each filtered as item, index (item.id)}
				<li class="{item.completed ? 'completed' : ''} {editing === index ? 'editing' : ''}">
					<div class="view">
						<input class="toggle" type="checkbox" bind:checked={item.completed} />
						<!-- svelte-ignore a11y-label-has-associated-control -->
						<label on:dblclick={() => (editing = index)}>{item.description}</label>
						<button on:click={() => remove(index)} class="destroy" />
					</div>

					{#if editing === index}
						<!-- svelte-ignore a11y-autofocus -->
						<input
							value={item.description}
							id="edit"
							class="edit"
							on:keydown={handleEdit}
							on:blur={submit}
							autofocus
						/>
					{/if}
				</li>
			{/each}
		</ul>

		<footer class="footer">
			<span class="todo-count">
				<strong>{numActive}</strong>
				{numActive === 1 ? 'item' : 'items'} left
			</span>

			<ul class="filters">
				<li>
					<a class:selected={currentFilter === 'all'} href="#/">All</a>
				</li>
				<li>
					<a class:selected={currentFilter === 'active'} href="#/active">Active</a>
				</li>
				<li>
					<a class:selected={currentFilter === 'completed'} href="#/completed">Completed</a>
				</li>
			</ul>

			{#if numCompleted}
				<button class="clear-completed" on:click={clearCompleted}>Clear completed</button>
			{/if}
		</footer>
	</section>
{/if}
