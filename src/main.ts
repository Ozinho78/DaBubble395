import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));





// Inject-Warnungen abschalten
// 22.03.2025 - Alexander Riedel
const originalWarn = console.warn;

console.warn = (...args: any[]) => {
  const message = typeof args[0] === 'string' ? args[0] : '';

  if (
    message.includes('Firebase API called outside injection context') ||
    message.includes('Calling Firebase APIs outside of an Injection context')
  ) {
    return;
  }

  originalWarn(...args);
};