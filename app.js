// Configuration
const config = {
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseKey: 'YOUR_SUPABASE_KEY',
  minPostLength: 10,
  maxPostLength: 500,
  colors: [
    '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#14b8a6', '#84cc16', '#f97316', '#64748b'
  ]
};

// Initialize Supabase
const supabase = supabase.createClient(config.supabaseUrl, config.supabaseKey);

// DOM Elements
const app = document.getElementById('app');

// State
let currentUser = {
  id: null,
  username: '',
  color: ''
};

// Main App Functions
async function initApp() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    renderAuthScreen();
  } else {
    await setupUser(session);
    renderMainApp();
    loadPosts();
  }
  
  setupAuthListener();
}

function setupAuthListener() {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      await setupUser(session);
      renderMainApp();
      loadPosts();
    } else {
      renderAuthScreen();
    }
  });
}

async function setupUser(session) {
  currentUser.id = session.user.id;
  
  // Generate random username and color if first time
  const randomNumber = Math.floor(Math.random() * 10000);
  currentUser.username = `anon_${randomNumber}`;
  currentUser.color = config.colors[Math.floor(Math.random() * config.colors.length)];
  
  // In a real app, you'd save this to your database
}

// Render Functions
function renderAuthScreen() {
  app.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-screen p-4">
      <div class="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden p-6">
        <div class="text-center mb-6">
          <h1 class="text-3xl font-bold text-purple-600 mb-2">Anony</h1>
          <p class="text-gray-600">The anonymous Kenyan social platform</p>
        </div>
        
        <button id="googleLogin" class="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg py-3 px-4 text-gray-700 font-medium hover:bg-gray-50">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.784-1.667-4.166-2.685-6.735-2.685-5.522 0-10 4.477-10 10s4.478 10 10 10c8.396 0 10-7.496 10-10 0-0.671-0.068-1.325-0.182-1.977h-9.818z"/>
          </svg>
          Continue with Google
        </button>
        
        <div class="mt-6 text-center text-sm text-gray-500">
          <p>No personal information stored. Completely anonymous.</p>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('googleLogin').addEventListener('click', () => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  });
}

function renderMainApp() {
  app.innerHTML = `
    <div class="max-w-md mx-auto">
      <!-- Header -->
      <header class="sticky top-0 bg-white shadow-sm z-10 p-4 flex justify-between items-center">
        <div class="flex items-center gap-2">
          <div class="avatar w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style="background-color: ${currentUser.color}">
            ${currentUser.username.charAt(0).toUpperCase()}
          </div>
          <span class="font-medium">${currentUser.username}</span>
        </div>
        <button id="logoutBtn" class="text-sm text-purple-600 hover:underline">Sign out</button>
      </header>
      
      <!-- Post Form -->
      <div class="p-4 bg-white border-b">
        <form id="postForm" class="space-y-2">
          <textarea 
            id="postInput"
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="What's on your mind? (min ${config.minPostLength} chars)"
            rows="3"
            minlength="${config.minPostLength}"
            maxlength="${config.maxPostLength}"
            required
          ></textarea>
          <div class="flex justify-between items-center">
            <span id="charCount" class="text-sm text-gray-500">0/${config.maxPostLength}</span>
            <button 
              type="submit"
              class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              disabled
            >
              Post
            </button>
          </div>
        </form>
      </div>
      
      <!-- Posts Feed -->
      <div id="postsFeed" class="pb-20"></div>
    </div>
  `;
  
  // Setup event listeners
  document.getElementById('logoutBtn').addEventListener('click', () => {
    supabase.auth.signOut();
  });
  
  const postInput = document.getElementById('postInput');
  const charCount = document.getElementById('charCount');
  const postForm = document.getElementById('postForm');
  const submitBtn = postForm.querySelector('button[type="submit"]');
  
  postInput.addEventListener('input', () => {
    const length = postInput.value.length;
    charCount.textContent = `${length}/${config.maxPostLength}`;
    submitBtn.disabled = length < config.minPostLength || length > config.maxPostLength;
  });
  
  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = postInput.value.trim();
    
    if (content.length < config.minPostLength) return;
    
    const { error } = await supabase
      .from('posts')
      .insert([{
        user_id: currentUser.id,
        username: currentUser.username,
        color: currentUser.color,
        content: content,
        upvotes: 0
      }]);
    
    if (!error) {
      postInput.value = '';
      charCount.textContent = `0/${config.maxPostLength}`;
      submitBtn.disabled = true;
      loadPosts();
    }
  });
}

async function loadPosts() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });
  
  const postsFeed = document.getElementById('postsFeed');
  
  if (error) {
    postsFeed.innerHTML = `
      <div class="p-4 text-center text-red-500">
        Error loading posts. Please try again.
      </div>
    `;
    return;
  }
  
  if (posts.length === 0) {
    postsFeed.innerHTML = `
      <div class="p-8 text-center text-gray-500">
        No posts yet. Be the first to share!
      </div>
    `;
    return;
  }
  
  postsFeed.innerHTML = posts.map(post => `
    <div class="post bg-white border-b p-4" data-post-id="${post.id}">
      <div class="flex items-start gap-3">
        <div class="avatar w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style="background-color: ${post.color}">
          ${post.username.charAt(0).toUpperCase()}
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="font-medium">${post.username}</span>
            <span class="text-xs text-gray-500">${formatTime(post.created_at)}</span>
          </div>
          <p class="mt-1 text-gray-800">${post.content}</p>
          
          <div class="mt-3 flex items-center gap-4">
            <button class="upvoteBtn flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600" data-post-id="${post.id}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
              </svg>
              <span>${post.upvotes || 0}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
  
  // Add upvote event listeners
  document.querySelectorAll('.upvoteBtn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const postId = e.currentTarget.getAttribute('data-post-id');
      await upvotePost(postId);
    });
  });
}

async function upvotePost(postId) {
  const { error } = await supabase.rpc('increment_upvotes', {
    post_id: postId
  });
  
  if (!error) {
    loadPosts();
  }
}

// Helper Functions
function formatTime(timestamp) {
  const now = new Date();
  const postTime = new Date(timestamp);
  const diffInHours = (now - postTime) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const minutes = Math.floor(diffInHours * 60);
    return `${minutes}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else {
    return postTime.toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric'
    });
  }
}

// Initialize the app
initApp();

// Create RPC function for upvotes (run this in Supabase SQL editor)
// CREATE OR REPLACE FUNCTION increment_upvotes(post_id bigint)
// RETURNS void AS $$
// BEGIN
//   UPDATE posts SET upvotes = COALESCE(upvotes, 0) + 1 WHERE id = post_id;
// END;
// $$ LANGUAGE plpgsql;