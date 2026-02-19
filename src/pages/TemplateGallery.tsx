import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { templates, blankTemplate } from '../lib/templates';

export default function TemplateGallery() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const createProject = async (config: typeof templates.flappy) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: config.title,
          config, // JSONB takes the object directly
        })
        .select('id')
        .single();

      if (error) throw error;
      if (data?.id) {
        navigate(`/editor/${data.id}`);
      }
    } catch (err) {
      console.error('Failed to create project:', err);
      alert('Error creating project');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
          Choose Your Game Template
        </h1>
        <p className="text-center text-gray-300 mb-12 text-xl">
          Start with a template or go blank — then customize in the editor!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Blank first */}
          <div
            onClick={() => createProject(blankTemplate)}
            className="bg-gray-800/60 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6 cursor-pointer hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 group"
          >
            <h2 className="text-2xl font-bold mb-3 group-hover:text-indigo-400 transition">Blank Canvas</h2>
            <p className="text-gray-400">Build from scratch — total freedom.</p>
          </div>

          {Object.entries(templates).map(([key, template]) => (
            <div
              key={key}
              onClick={() => createProject(template)}
              className="bg-gray-800/60 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6 cursor-pointer hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 group"
            >
              <h2 className="text-2xl font-bold mb-3 group-hover:text-purple-400 transition">{template.title}</h2>
              <p className="text-gray-400">
                {key === 'flappy' && 'Jump through endless pipes!'}
                {key === 'invaders' && 'Defend Earth from alien waves!'}
                {key === 'runner' && 'Run forever, dodge obstacles!'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}