# FashionStyle.ai - Virtual Try-On Platform

## Product Requirements Document (PRD)

### Overview
FashionStyle.ai is a virtual try-on platform that allows users to visualize how clothing items would look on them using AI-powered technology.

### Core Features
1. **Photo Management**
   - Upload up to 3 full-body photos
   - Take photos directly through the camera
   - Preview and select photos for try-on

2. **Clothing Upload**
   - Upload clothing items for virtual try-on
   - Support for various clothing types
   - Description-based clothing matching

3. **Virtual Try-On**
   - AI-powered clothing visualization
   - Real-time preview
   - High-quality output generation
   - Save and share results

### Technical Stack
- Next.js for frontend and API routes
- Replicate API for AI model integration
- Tailwind CSS for styling
- TypeScript for type safety
- Radix UI for accessible components

### Getting Started
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - REPLICATE_API_KEY=your_api_key

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view the application

### API Integration
The application uses Replicate's IDM-VTON model for virtual try-on capabilities. Ensure you have proper API access and credentials configured.

### Contributing
Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

### License
This project is licensed under the MIT License - see the LICENSE file for details.

6. The existing code allows uploading up to 3 body photos. Change it that users could delete any of these photos with small "cross" delete icon on the top right of each thumbnail photo. And the delete action should remove the photo from the array and re-order the photos. 

7. The uploaded bodyphotos and clothing photos should be uploaed to the public/images folder and be named like [user]-body1.jpg, [user]-body2.jpg, [user]-body3.jpg, [user]-cloth1.jpg, [user]-cloth2.jpg, [user]-cloth3.jpg etc. The [user] should be some identifier of the user from a particluar browser session. If the user browse app again, the user could be identified with the same [user] identifier.

8. When user reload the app, the uploaded bodyphotos and clothing photos should be loaded from the public/images folder and shown in the UI.

8. The virtual try-on result image should be saved in the public/images folder and be named like [user]-result.jpg.


