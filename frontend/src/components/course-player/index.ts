export { CourseNavigation } from './CourseNavigation';
export { VideoPlayer } from './VideoPlayer';
// PdfViewer is NOT re-exported from the barrel: react-pdf must be dynamically
// imported with ssr:false. Import the module directly via dynamic().
export { TextContent } from './TextContent';
export { QuizPlayer } from './QuizPlayer';
export { AssignmentPlayer } from './AssignmentPlayer';
