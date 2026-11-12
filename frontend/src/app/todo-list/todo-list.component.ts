import { Component, inject, computed, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { TodoService, Todo } from '../todo.service';
import { EditableDirective } from '../editable.directive';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [FormsModule, RouterLink, EditableDirective],
  template: `
    <div class="todo-container">
      <!-- En-tête avec bouton Dark Mode -->
      <div class="header">
        <h2>Ma ToDo List</h2>
        <button class="btn-theme" (click)="toggleTheme()" title="Changer de thème">
          {{ isDarkMode() ? '☀️' : '🌙' }}
        </button>
      </div>

      <div class="add-todo">
        <input
          type="text"
          [(ngModel)]="newTodoText"
          (keydown.enter)="add()"
          placeholder="Nouvelle tâche... (Appuyez sur Entrée)"
        />
      </div>

      <div class="filters">
        <a routerLink="/all" [class.active]="filter() === 'all'">Toutes</a>
        <a routerLink="/in-progress" [class.active]="filter() === 'in-progress'">En cours</a>
        <a routerLink="/done" [class.active]="filter() === 'done'">Terminées</a>
      </div>

      <!-- Liste standard sans Drag & Drop -->
      <ul>
        @for (todo of filteredTodos(); track todo.id) {
          <li>
            <div class="todo-main">
              <input
                type="checkbox"
                [checked]="todo.status === 'done'"
                (change)="toggleStatus(todo)"
              />

              <div
                class="todo-text"
                [class.done]="todo.status === 'done'"
                appEditable
                (editComplete)="updateText(todo.id, $event)"
                title="Double-cliquez pour éditer"
              >
                {{ todo.text }}
              </div>

              <!-- Bouton Détails (Chevron) -->
              <button
                (click)="toggleDetails(todo.id)"
                class="btn-icon"
                [class.expanded]="expandedTaskId() === todo.id"
                title="Détails"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  stroke="currentColor"
                  stroke-width="2"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              <!-- Bouton Supprimer -->
              <button (click)="delete(todo.id)" class="btn-delete" title="Supprimer">✖</button>
            </div>

            <!-- Accordéon des détails -->
            @if (expandedTaskId() === todo.id) {
              <div class="todo-details">
                <textarea
                  #descInput
                  [value]="todo.description || ''"
                  (change)="updateDescription(todo.id, descInput.value)"
                  placeholder="Ajoutez des détails ici... (Sauvegarde automatique en cliquant ailleurs)"
                ></textarea>
              </div>
            }
          </li>
        } @empty {
          <p class="empty-state">Aucune tâche dans cette catégorie.</p>
        }
      </ul>
    </div>
  `,
  styles: [
    `
      .todo-container {
        max-width: 500px;
        margin: 4rem auto;
        padding: 2rem;
        border-radius: 12px;
        background: var(--card-bg);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        transition: background-color 0.3s ease;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      h2 {
        color: var(--text-color);
        margin: 0;
      }

      .btn-theme {
        background: transparent;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        transition: transform 0.2s;
      }
      .btn-theme:hover {
        transform: scale(1.1);
      }

      .add-todo input {
        width: 100%;
        padding: 12px 16px;
        font-size: 1rem;
        border-radius: 8px;
        box-sizing: border-box;
        background: var(--input-bg);
        color: var(--text-color);
        border: 1px solid var(--border-color);
      }
      .add-todo input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
      }

      .filters {
        display: flex;
        justify-content: center;
        gap: 12px;
        margin-bottom: 1.5rem;
        margin-top: 1rem;
      }
      .filters a {
        text-decoration: none;
        padding: 6px 16px;
        background: var(--item-bg);
        border-radius: 20px;
        color: var(--text-muted);
        font-size: 0.875rem;
        transition: all 0.2s;
      }
      .filters a.active {
        background: #3b82f6;
        color: white;
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      li {
        display: flex;
        flex-direction: column;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 10px;
        background: var(--item-bg);
        border: 1px solid var(--border-color);
        transition:
          transform 0.1s,
          box-shadow 0.1s;
      }

      li:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      }

      .todo-main {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
      }

      input[type='checkbox'] {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: #10b981;
      }
      .todo-text {
        flex-grow: 1;
        cursor: text;
        font-size: 1rem;
        color: var(--text-color);
        transition: color 0.2s;
      }
      .todo-text.done {
        text-decoration: line-through;
        color: var(--text-muted);
      }

      .btn-delete,
      .btn-icon {
        border: none;
        width: 30px;
        height: 30px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .btn-delete {
        background: #ef4444;
        color: white;
        transition: background-color 0.2s;
      }
      .btn-delete:hover {
        background: #dc2626;
      }

      .btn-icon {
        background: transparent;
        color: var(--text-muted);
        transition: background-color 0.2s;
      }
      .btn-icon:hover {
        background: var(--border-color);
        color: var(--text-color);
      }
      .btn-icon svg {
        transition: transform 0.3s ease;
      }
      .btn-icon.expanded svg {
        transform: rotate(180deg);
      }

      .todo-details {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px dashed var(--border-color);
      }
      .todo-details textarea {
        width: 100%;
        padding: 10px;
        border-radius: 6px;
        min-height: 80px;
        font-family: inherit;
        font-size: 0.9rem;
        resize: vertical;
        box-sizing: border-box;
        background: var(--input-bg);
        color: var(--text-color);
        border: 1px solid var(--border-color);
      }
      .todo-details textarea:focus {
        outline: none;
        border-color: #3b82f6;
      }

      .empty-state {
        text-align: center;
        color: var(--text-muted);
        font-style: italic;
      }
    `,
  ],
})
export class TodoListComponent implements OnInit {
  todoService = inject(TodoService);
  document = inject(DOCUMENT);

  filter = input<string>('all');
  expandedTaskId = signal<number | null>(null);
  isDarkMode = signal<boolean>(false);

  filteredTodos = computed(() => {
    const currentFilter = this.filter();
    const todos = this.todoService.todos();
    if (currentFilter === 'in-progress') return todos.filter((t) => t.status === 'in-progress');
    if (currentFilter === 'done') return todos.filter((t) => t.status === 'done');
    return todos;
  });

  newTodoText = '';

  ngOnInit() {
    this.todoService.loadTodos();
  }

  add() {
    if (this.newTodoText.trim()) {
      this.todoService.addTodo(this.newTodoText.trim());
      this.newTodoText = '';
    }
  }

  updateText(id: number, newText: string) {
    if (newText.trim()) this.todoService.updateTodo(id, { text: newText.trim() });
  }

  updateDescription(id: number, newDescription: string) {
    this.todoService.updateTodo(id, { description: newDescription });
  }

  toggleStatus(todo: Todo) {
    const newStatus = todo.status === 'done' ? 'in-progress' : 'done';
    this.todoService.updateTodo(todo.id, { status: newStatus });
  }

  delete(id: number) {
    this.todoService.deleteTodo(id);
  }

  toggleDetails(id: number) {
    this.expandedTaskId.update((currentId) => (currentId === id ? null : id));
  }

  toggleTheme() {
    this.isDarkMode.update((v) => !v);
    if (this.isDarkMode()) {
      this.document.body.classList.add('dark-theme');
    } else {
      this.document.body.classList.remove('dark-theme');
    }
  }
}
