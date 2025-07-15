import { Controller } from "@hotwired/stimulus";

// Connects to data-controller="copy-to-clipboard"
export default class extends Controller {
  static targets = ["source", "button"]
  static values = { 
    code: String,
    successMessage: { type: String, default: "Copied!" },
    successDuration: { type: Number, default: 2000 }
  }

  connect() {
    // Create and inject the copy button
    console.log("Copy to Clipboard Controller connected");
    this.createCopyButton();
  }

  createCopyButton() {
    // Find the CodeBlock container with class "relative group"
    const codeBlockContainer = this.element.querySelector('.relative.group');
    
    if (!codeBlockContainer) {
      console.error('Could not find code block container');
      return;
    }
    
    // Create the copy button element
    const button = document.createElement("button");
    button.setAttribute("data-copy-to-clipboard-target", "button");
    button.setAttribute("data-action", "click->copy_to_clipboard#copy");
    button.className = "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 p-2 rounded text-xs font-medium flex items-center gap-1 z-10";
    
    // Create clipboard icon SVG
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("class", "w-4 h-4");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("viewBox", "0 0 24 24");
    
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("d", "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z");
    
    icon.appendChild(path);
    
    // Create text span
    const textSpan = document.createElement("span");
    textSpan.className = "copy-text";
    
    // Create success span (hidden initially)
    const successSpan = document.createElement("span");
    successSpan.textContent = this.successMessageValue;
    successSpan.className = "success-text hidden";
    
    // Assemble button
    button.appendChild(icon);
    button.appendChild(textSpan);
    button.appendChild(successSpan);
    
    // Add button to the code block container (which has the group hover effect)
    codeBlockContainer.appendChild(button);
  }

  async copy(event) {
    event.preventDefault();
    
    const button = event.currentTarget;
    const copyText = button.querySelector('.copy-text');
    const successText = button.querySelector('.success-text');
    
    try {
      // Get the code to copy - either from data attribute or from the code block content
      const codeToCopy = this.codeValue || this.getCodeFromElement();
      
      await navigator.clipboard.writeText(codeToCopy);
      
      // Show success state
      copyText.classList.add('hidden');
      successText.classList.remove('hidden');
      
      // Reset after specified duration
      setTimeout(() => {
        copyText.classList.remove('hidden');
        successText.classList.add('hidden');
      }, this.successDurationValue);
      
    } catch (err) {
      console.error('Failed to copy code:', err);
      
      // Fallback for older browsers
      this.fallbackCopy(this.codeValue || this.getCodeFromElement());
    }
  }

  getCodeFromElement() {
    // Try to get code from various possible sources
    const codeElement = this.element.querySelector('code');
    const preElement = this.element.querySelector('pre');
    
    if (codeElement) {
      return codeElement.textContent;
    } else if (preElement) {
      return preElement.textContent;
    } else {
      return this.element.textContent;
    }
  }

  fallbackCopy(text) {
    // Fallback method for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      const button = this.element.querySelector('[data-copy-to-clipboard-target="button"]');
      const copyText = button.querySelector('.copy-text');
      const successText = button.querySelector('.success-text');
      
      copyText.classList.add('hidden');
      successText.classList.remove('hidden');
      
      setTimeout(() => {
        copyText.classList.remove('hidden');
        successText.classList.add('hidden');
      }, this.successDurationValue);
    } catch (err) {
      console.error('Fallback copy failed:', err);
    } finally {
      document.body.removeChild(textArea);
    }
  }
}