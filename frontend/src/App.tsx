import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { BookDetail } from './pages/BookDetail';
import { Dashboard } from './pages/Dashboard';
import { EditBook } from './pages/EditBook';
import { NewBook } from './pages/NewBook';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/books/new" element={<NewBook />} />
        <Route path="/books/:id" element={<BookDetail />} />
        <Route path="/books/:id/edit" element={<EditBook />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
