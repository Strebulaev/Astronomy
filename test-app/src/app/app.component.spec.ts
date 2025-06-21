import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  selectedTest: string | null = null;

  onThemeSelected(testFile: string): void {
    this.selectedTest = testFile;
  }
}