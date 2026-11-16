import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Full-screen loading overlay. Rendered once by the app shell while `LoaderService.isLoading()`. */
@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderComponent {}
