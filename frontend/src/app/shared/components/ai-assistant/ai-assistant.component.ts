import { Component, inject, signal, OnInit, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AiService } from '../../../core/services/ai.service';
import { NotificationService } from '../../../core/services/notification.service';
import { filter } from 'rxjs/operators';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.scss']
})
export class AiAssistantComponent implements OnInit, AfterViewChecked {
  private aiService = inject(AiService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  @ViewChild('chatBody') private chatBody!: ElementRef;

  isOpen = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  inputText = signal<string>('');
  activeTripId = signal<string | null>(null);

  messages = signal<ChatMessage[]>([
    {
      sender: 'ai',
      text: 'Hello! I am your AI Travel Assistant. Ask me anything about local eats, cash safety, or type "Reduce my budget" or "Extend trip" to edit your plan directly!',
      timestamp: new Date()
    }
  ]);

  // Quick suggestion prompts
  suggestions = signal<string[]>([]);

  ngOnInit(): void {
    this.detectActiveTrip();
    
    // Listen for route changes to update active trip context
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.detectActiveTrip();
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  detectActiveTrip(): void {
    const url = this.router.url;
    if (url.includes('/itinerary/')) {
      const parts = url.split('/');
      const id = parts[parts.indexOf('itinerary') + 1]?.split('?')[0];
      if (id && id !== this.activeTripId()) {
        this.activeTripId.set(id);
        this.messages.set([
          {
            sender: 'ai',
            text: 'I see you are viewing your itinerary! I can modify it directly. Try asking: "Reduce my budget", "Extend trip", or ask for "Vegetarian restaurants nearby".',
            timestamp: new Date()
          }
        ]);
        this.updateSuggestions(true);
      }
    } else {
      if (this.activeTripId() !== null) {
        this.activeTripId.set(null);
        this.messages.set([
          {
            sender: 'ai',
            text: 'Hello! I am your AI Travel Assistant. How can I help optimize or plan your trip today?',
            timestamp: new Date()
          }
        ]);
        this.updateSuggestions(false);
      }
    }
  }

  updateSuggestions(hasActiveTrip: boolean): void {
    if (hasActiveTrip) {
      this.suggestions.set([
        'Reduce my budget',
        'Extend trip by a day',
        'Add a vegetarian diner',
        'How much cash to carry?'
      ]);
    } else {
      this.suggestions.set([
        'Best spots for July',
        'Honeymoon places in India',
        'Weekend trips from Delhi',
        'Hill stations under ₹10,000'
      ]);
    }
  }

  toggleAssistant(): void {
    this.isOpen.update(val => !val);
  }

  clickSuggestion(text: string): void {
    this.sendMessage(text);
  }

  sendMessage(textToUse?: string): void {
    const msgText = (textToUse || this.inputText()).trim();
    if (!msgText) return;

    // Append user message
    const userMsg: ChatMessage = {
      sender: 'user',
      text: msgText,
      timestamp: new Date()
    };
    this.messages.update(prev => [...prev, userMsg]);
    
    if (!textToUse) {
      this.inputText.set('');
    }

    this.isLoading.set(true);

    const history = this.messages().map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    this.aiService.chat(msgText, this.activeTripId() || undefined, history).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const aiMsg: ChatMessage = {
          sender: 'ai',
          text: res.data.reply,
          timestamp: new Date()
        };
        this.messages.update(prev => [...prev, aiMsg]);

        // If itinerary was modified, trigger global reload
        if (res.data.modified) {
          this.notification.success('Itinerary adjusted by AI Assistant!');
          this.aiService.itineraryModified$.next();
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.messages.update(prev => [...prev, {
          sender: 'ai',
          text: 'Oops! I encountered an error connecting to my database networks. Please try again.',
          timestamp: new Date()
        }]);
      }
    });
  }

  scrollToBottom(): void {
    try {
      this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
