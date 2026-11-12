// frontend/src/app/todo.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Todo {
  id: number;
  text: string;
  status: 'in-progress' | 'done';
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class TodoService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/todos';

  // État global de l'application
  todos = signal<Todo[]>([]);

  loadTodos() {
    this.http.get<Todo[]>(this.apiUrl).subscribe(data => this.todos.set(data));
  }

  addTodo(text: string) {
    this.http.post<Todo>(this.apiUrl, { text }).subscribe(newTodo => {
      this.todos.update(current => [...current, newTodo]);
    });
  }

  updateTodo(id: number, changes: Partial<Todo>) {
    this.http.put<Todo>(`${this.apiUrl}/${id}`, changes).subscribe(updatedTodo => {
      this.todos.update(current =>
        current.map(todo => (todo.id === id ? updatedTodo : todo))
      );
    });
  }

  deleteTodo(id: number) {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe(() => {
      this.todos.update(current => current.filter(todo => todo.id !== id));
    });
  }
}
