import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: "./app.html",
  styleUrls: ['./app.css'],
  imports: [RouterModule, CommonModule],
  standalone: true
})
export class App {}