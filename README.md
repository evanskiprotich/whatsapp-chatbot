

<p align="center"> <a href="http://nestjs.com/" target="blank"><img src="https://media.istockphoto.com/id/1280814476/photo/cute-artificial-intelligence-robot-with-notebook.jpg?s=612x612&w=0&k=20&c=Hrqr-5X0C2RKayeiUuQQq-1HRykO8X_fjps8ttgcpGg=" height="300"  alt="Nest Logo" /></a> </p> <p align="center"> A production-ready <a href="http://nodejs.org" target="_blank">Node.js</a> WhatsApp chatbot built with <a href="https://nestjs.com/" target="_blank">NestJS</a>, leveraging the <a href="https://developers.facebook.com/docs/whatsapp/cloud-api" target="_blank">WhatsApp Cloud API</a> for direct integration with WhatsApp, GPT-4o for conversational intelligence and MySQL for context management. </p>


## Step-by-Step Guide
For a detailed, step-by-step guide on building this chatbot, check out:

**Key Features:**

* **Llama 3.2 Integration:** Utilises the advanced capabilities of Llama for natural language understanding and generation, ensuring engaging and intelligent conversations.
* **Text-To-Image Generation:** Utilises Stability AI's `Stable Diffusion` model for text-to-image generation.
* **MySQL for Context:** Stores conversation context in MySQL, enabling the chatbot to maintain a cohesive dialogue and provide context-aware responses.
* **NestJS Framework:** Built on the robust and scalable NestJS framework, providing a well-structured and maintainable codebase.
* **Production-Ready:** Designed with production environments in mind, ensuring security, stability, scalability, and reliability.

**Getting Started:**

1. **Install Node.js:** Download and install the latest version of Node.js from [https://nodejs.org/](https://nodejs.org/).

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**

    - Set up environment variables for API keys (OpenAI, WhatsApp API provider), database credentials (Redis), and other necessary configurations.

4. **Run the Chatbot:**

    - **Development Mode:**
      ```bash
      npm run start:dev
      ```
      This command starts the chatbot in development mode with file watching for changes.

    - **Debug Mode:**
      ```bash
      npm run start:debug
      ```
      This command starts the chatbot in debug mode with file watching for changes, enabling you to use a debugger.

    - **Production Mode:**
      ```bash
      npm run start:prod
      ```
      This command starts the chatbot in production mode, optimized for performance and stability.

## Connecting Your Backend To WhatsApp:

- **No third-party providers needed!** You can directly integrate with the WhatsApp Cloud API by following these steps:
   1. Create a Facebook Developer account at [https://developers.facebook.com/](https://developers.facebook.com/).
   2. Create a WhatsApp Business account and integrate it with your Facebook Developer account.
   3. Follow the official WhatsApp Cloud API documentation to configure your chatbot. (details to be saved to your environment file)


**Testing (Contributions are welcome - running by grace, no tests):**

* **Unit Tests:**

   ```bash
   npm run test
   ```

* **End-to-End (E2E) Tests:**

   ```bash
   npm run test:e2e
   ```

**Support and Contribution:**

We welcome contributions and feedback. If you encounter issues or have suggestions, please open an issue on GitHub.

**Acknowledgements:**

This chatbot is made possible by the incredible work of the following projects:

* [NestJS](https://nestjs.com/)
* [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/)
* [GPT-4o](https://platform.openai.com/docs/models/gpt-4o)
* [Upstash Redis](https://upstash.com/)
* [MySQL](https://github.com/mysql)
* [openai](https://github.com/openai/openai-node)

**Let's build a smarter and more engaging WhatsApp experience!** 
