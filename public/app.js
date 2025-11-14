// Estado global de la aplicación
const state = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  courses: [],
  myCourses: [],
  schedule: [],
  progress: null,
};

// Referencias a elementos del DOM
const sections = document.querySelectorAll('.view');
const navButtons = document.querySelectorAll('.nav-btn');
const authSection = document.getElementById('auth');
const authActions = document.getElementById('authActions');
const userInfo = document.getElementById('userInfo');
const userGreeting = document.getElementById('userGreeting');
const logoutBtn = document.getElementById('logoutBtn');
const yearSpan = document.getElementById('year');

// Formularios
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginMessage = document.getElementById('loginMessage');
const registerMessage = document.getElementById('registerMessage');
const courseForm = document.getElementById('courseForm');
const courseMessage = document.getElementById('courseMessage');
const scheduleForm = document.getElementById('scheduleForm');
const scheduleMessage = document.getElementById('scheduleMessage');

// Contenedores dinámicos
const dashboardSummary = document.getElementById('dashboardSummary');
const coursesGrid = document.getElementById('coursesGrid');
const courseDetail = document.getElementById('courseDetail');
const docenteCourseForm = document.getElementById('docenteCourseForm');
const docenteScheduleForm = document.getElementById('docenteScheduleForm');
const scheduleCourseSelect = document.getElementById('scheduleCourse');
const scheduleGrid = document.getElementById('scheduleGrid');
const progressContainer = document.getElementById('progressContainer');

// Botones extra
const showLogin = document.getElementById('showLogin');
const showRegister = document.getElementById('showRegister');
const refreshCourses = document.getElementById('refreshCourses');
const refreshSchedule = document.getElementById('refreshSchedule');

// Utilidad para realizar peticiones autenticadas
async function apiFetch(url, options = {}) {
  const headers = options.headers || {};
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...headers } });
  if (response.status === 401) {
    logout();
    throw new Error('Sesión expirada');
  }
  return response;
}

function showSection(sectionId) {
  sections.forEach((section) => {
    section.classList.toggle('hidden', section.id !== sectionId);
  });
  navButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.section === sectionId);
  });
}

function updateSessionUI() {
  if (state.user && state.token) {
    authActions.classList.add('hidden');
    userInfo.classList.remove('hidden');
    userGreeting.textContent = `Hola, ${state.user.nombre}`;
    authSection.classList.add('hidden');
  } else {
    authActions.classList.remove('hidden');
    userInfo.classList.add('hidden');
    authSection.classList.remove('hidden');
    showSection('auth');
  }
  docenteCourseForm.classList.toggle('hidden', !(state.user && state.user.rol === 'DOCENTE'));
  docenteScheduleForm.classList.toggle('hidden', !(state.user && state.user.rol === 'DOCENTE'));
}

function persistSession() {
  if (state.token && state.user) {
    localStorage.setItem('token', state.token);
    localStorage.setItem('user', JSON.stringify(state.user));
  } else {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

async function login(event) {
  event.preventDefault();
  loginMessage.textContent = '';
  loginMessage.className = 'form-message';
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Error al iniciar sesión');
    }
    state.token = data.token;
    state.user = data.user;
    persistSession();
    updateSessionUI();
    await loadInitialData();
    showSection('dashboard');
    loginForm.reset();
  } catch (error) {
    loginMessage.textContent = error.message;
    loginMessage.classList.add('error');
  }
}

async function register(event) {
  event.preventDefault();
  registerMessage.textContent = '';
  registerMessage.className = 'form-message';
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: document.getElementById('registerName').value,
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value,
        rol: document.getElementById('registerRole').value,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Error al registrar');
    }
    registerMessage.textContent = 'Registro exitoso. Ya podés iniciar sesión.';
    registerMessage.classList.add('success');
    registerForm.reset();
  } catch (error) {
    registerMessage.textContent = error.message;
    registerMessage.classList.add('error');
  }
}

function logout() {
  if (state.token) {
    apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  }
  state.token = null;
  state.user = null;
  state.courses = [];
  state.myCourses = [];
  state.schedule = [];
  state.progress = null;
  persistSession();
  updateSessionUI();
}

async function fetchCourses() {
  const response = await apiFetch('/api/courses');
  const data = await response.json();
  state.courses = data;
}

async function fetchMyCourses() {
  const response = await apiFetch('/api/my-courses');
  state.myCourses = await response.json();
}

async function fetchSchedule() {
  const response = await apiFetch('/api/schedule');
  state.schedule = await response.json();
}

async function fetchProgress() {
  const response = await apiFetch('/api/my-progress');
  state.progress = await response.json();
}

function renderDashboard() {
  dashboardSummary.innerHTML = '';
  const cards = [];
  const totalCursos = state.user?.rol === 'DOCENTE' ? state.courses.filter((c) => c.docenteId === state.user.id).length : state.myCourses.length;
  cards.push({ titulo: 'Cursos activos', valor: totalCursos });

  if (state.user?.rol === 'ESTUDIANTE') {
    const totalModulos = state.progress?.resumen?.totalModulos || 0;
    const completados = state.progress?.resumen?.completados || 0;
    const myCourseIds = new Set(state.myCourses.map((c) => c.id));
    const nextEvent = state.schedule.find((event) => myCourseIds.has(event.courseId));
    cards.push({ titulo: 'Módulos completados', valor: `${completados}/${totalModulos}` });
    cards.push({
      titulo: 'Próxima clase',
      valor: nextEvent ? new Date(nextEvent.fechaHoraInicio).toLocaleString() : 'Sin eventos',
    });
  } else {
    const docEvents = state.schedule.filter((ev) => ev.Course?.docenteId === state.user?.id);
    docEvents.sort((a, b) => new Date(a.fechaHoraInicio) - new Date(b.fechaHoraInicio));
    const upcoming = docEvents[0];
    cards.push({
      titulo: 'Próxima clase',
      valor: upcoming ? new Date(upcoming.fechaHoraInicio).toLocaleString() : 'Sin eventos',
    });
  }

  cards.forEach((card) => {
    const div = document.createElement('div');
    div.className = 'dashboard-card';
    div.innerHTML = `<span>${card.titulo}</span><strong>${card.valor}</strong>`;
    dashboardSummary.appendChild(div);
  });
}

function renderCourses() {
  coursesGrid.innerHTML = '';
  state.courses.forEach((course) => {
    const card = document.createElement('article');
    card.className = 'card course-card';
    const docente = course.docente ? `Docente: ${course.docente.nombre}` : '';
    card.innerHTML = `
      <div class="badge">${course.nivel}</div>
      <h3>${course.titulo}</h3>
      <p>${course.descripcion}</p>
      <p class="muted">${docente}</p>
      <div class="module-actions"></div>
    `;

    const actions = card.querySelector('.module-actions');
    const viewButton = document.createElement('button');
    viewButton.className = 'secondary';
    viewButton.textContent = 'Ver curso';
    viewButton.addEventListener('click', () => openCourseDetail(course.id));
    actions.appendChild(viewButton);

    if (state.user?.rol === 'ESTUDIANTE') {
      const alreadyEnrolled = state.myCourses.some((c) => c.id === course.id);
      if (!alreadyEnrolled) {
        const enrollBtn = document.createElement('button');
        enrollBtn.textContent = 'Inscribirme';
        enrollBtn.addEventListener('click', () => enrollCourse(course.id));
        actions.appendChild(enrollBtn);
      }
    }

    if (state.user?.rol === 'DOCENTE' && course.docenteId === state.user.id) {
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Editar';
      editBtn.addEventListener('click', () => editCourse(course));
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Eliminar';
      deleteBtn.addEventListener('click', () => deleteCourse(course.id));
      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
    }

    coursesGrid.appendChild(card);
  });
}

async function openCourseDetail(courseId) {
  const response = await apiFetch(`/api/courses/${courseId}`);
  const course = await response.json();
  courseDetail.classList.remove('hidden');
  const isDocenteOwner = state.user?.rol === 'DOCENTE' && course.docenteId === state.user.id;

  courseDetail.innerHTML = `
    <h2>${course.titulo}</h2>
    <p>${course.descripcion}</p>
    <p><strong>Nivel:</strong> ${course.nivel}</p>
    <p><strong>Docente:</strong> ${course.docente?.nombre || 'Sin asignar'}</p>
    <h3>Módulos</h3>
  `;

  const moduleList = document.createElement('div');
  moduleList.className = 'module-list';

  if (course.modulos.length === 0) {
    moduleList.innerHTML = '<p>No hay módulos disponibles.</p>';
  } else {
    course.modulos
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .forEach((mod) => {
        const moduleItem = document.createElement('div');
        moduleItem.className = 'module-item';
        moduleItem.innerHTML = `
          <div class="module-header">
            <strong>${mod.orden}. ${mod.titulo}</strong>
            <span class="badge">${mod.duracionEstimada || 'Sin duración'}</span>
          </div>
          <p>${mod.descripcion}</p>
          ${mod.videoUrl ? `<a href="${mod.videoUrl}" target="_blank">Ver video</a>` : ''}
        `;

        const actions = document.createElement('div');
        actions.className = 'module-actions';

        if (state.user?.rol === 'ESTUDIANTE') {
          const completeBtn = document.createElement('button');
          completeBtn.textContent = 'Marcar completado';
          completeBtn.addEventListener('click', () => completeModule(mod.id));
          actions.appendChild(completeBtn);
        }

        if (isDocenteOwner) {
          const editBtn = document.createElement('button');
          editBtn.textContent = 'Editar';
          editBtn.addEventListener('click', () => editModule(mod));
          const deleteBtn = document.createElement('button');
          deleteBtn.textContent = 'Eliminar';
          deleteBtn.addEventListener('click', () => deleteModule(mod.id, courseId));
          actions.append(editBtn, deleteBtn);
        }

        moduleItem.appendChild(actions);
        moduleList.appendChild(moduleItem);
      });
  }

  courseDetail.appendChild(moduleList);

  if (isDocenteOwner) {
    const form = document.createElement('form');
    form.className = 'module-form';
    form.innerHTML = `
      <h4>Agregar módulo</h4>
      <label>Título<input required name="titulo" /></label>
      <label>Descripción<textarea required name="descripcion"></textarea></label>
      <label>Duración estimada<input name="duracionEstimada" placeholder="30 min" /></label>
      <label>URL del video<input name="videoUrl" placeholder="https://" /></label>
      <label>Orden<input type="number" name="orden" min="1" value="${course.modulos.length + 1}" /></label>
      <button type="submit">Guardar módulo</button>
      <p class="form-message" id="moduleMessage"></p>
    `;
    courseDetail.appendChild(form);
    const moduleMessage = form.querySelector('#moduleMessage');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      moduleMessage.textContent = '';
      const formData = new FormData(form);
      try {
        const response = await apiFetch(`/api/courses/${courseId}/modules`, {
          method: 'POST',
          body: JSON.stringify(Object.fromEntries(formData.entries())),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Error al crear módulo');
        }
        moduleMessage.textContent = 'Módulo creado correctamente';
        moduleMessage.className = 'form-message success';
        await refreshCoursesData();
        openCourseDetail(courseId);
      } catch (error) {
        moduleMessage.textContent = error.message;
        moduleMessage.className = 'form-message error';
      }
    });
  }

  courseDetail.dataset.courseId = courseId;
}

async function editCourse(course) {
  const titulo = prompt('Nuevo título', course.titulo) || course.titulo;
  const descripcion = prompt('Nueva descripción', course.descripcion) || course.descripcion;
  const nivel = prompt('Nivel (Inicial/Intermedio/Avanzado)', course.nivel) || course.nivel;
  await apiFetch(`/api/courses/${course.id}`, {
    method: 'PUT',
    body: JSON.stringify({ titulo, descripcion, nivel }),
  });
  await refreshCoursesData();
}

async function deleteCourse(courseId) {
  if (!confirm('¿Seguro que quieres eliminar este curso?')) return;
  await apiFetch(`/api/courses/${courseId}`, { method: 'DELETE' });
  await refreshCoursesData();
}

async function enrollCourse(courseId) {
  const response = await apiFetch(`/api/courses/${courseId}/enroll`, { method: 'POST' });
  if (!response.ok) {
    const data = await response.json();
    alert(data.message || 'No fue posible inscribirse');
    return;
  }
  await refreshCoursesData();
  alert('Inscripción exitosa');
}

async function editModule(module) {
  const titulo = prompt('Nuevo título', module.titulo);
  if (titulo === null) return;
  const descripcion = prompt('Nueva descripción', module.descripcion);
  if (descripcion === null) return;
  const duracionEstimada = prompt('Duración estimada', module.duracionEstimada || '');
  if (duracionEstimada === null) return;
  const videoUrl = prompt('URL de video', module.videoUrl || '');
  if (videoUrl === null) return;
  const orden = prompt('Orden', module.orden);
  if (orden === null) return;
  await apiFetch(`/api/modules/${module.id}`, {
    method: 'PUT',
    body: JSON.stringify({ titulo, descripcion, duracionEstimada, videoUrl, orden }),
  });
  await refreshCoursesData();
  openCourseDetail(courseDetail.dataset.courseId);
}

async function deleteModule(moduleId, courseId) {
  if (!confirm('¿Eliminar módulo?')) return;
  await apiFetch(`/api/modules/${moduleId}`, { method: 'DELETE' });
  await refreshCoursesData();
  openCourseDetail(courseId);
}

async function completeModule(moduleId) {
  const response = await apiFetch(`/api/modules/${moduleId}/complete`, { method: 'POST' });
  if (!response.ok) {
    const data = await response.json();
    alert(data.message || 'No se pudo actualizar el módulo');
    return;
  }
  await fetchProgress();
  renderProgress();
  alert('¡Buen trabajo! Módulo completado.');
}

function renderSchedule() {
  scheduleGrid.innerHTML = '';
  state.schedule.forEach((event) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${event.titulo}</h3>
      <p>${event.descripcion || 'Sin descripción'}</p>
      <p><strong>Curso:</strong> ${event.Course?.titulo || 'General'}</p>
      <p><strong>Inicio:</strong> ${new Date(event.fechaHoraInicio).toLocaleString()}</p>
      <p><strong>Fin:</strong> ${new Date(event.fechaHoraFin).toLocaleString()}</p>
    `;

    if (state.user?.rol === 'DOCENTE') {
      const actions = document.createElement('div');
      actions.className = 'module-actions';
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Editar';
      editBtn.addEventListener('click', () => editEvent(event));
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Eliminar';
      deleteBtn.addEventListener('click', () => deleteEvent(event.id));
      actions.append(editBtn, deleteBtn);
      card.appendChild(actions);
    }

    scheduleGrid.appendChild(card);
  });
}

async function editEvent(event) {
  const titulo = prompt('Título del evento', event.titulo) || event.titulo;
  const descripcion = prompt('Descripción', event.descripcion || '') || event.descripcion;
  const fechaHoraInicio = prompt('Fecha inicio (YYYY-MM-DD HH:MM)', event.fechaHoraInicio.replace('Z', '')) || event.fechaHoraInicio;
  const fechaHoraFin = prompt('Fecha fin (YYYY-MM-DD HH:MM)', event.fechaHoraFin.replace('Z', '')) || event.fechaHoraFin;
  await apiFetch(`/api/schedule/${event.id}`, {
    method: 'PUT',
    body: JSON.stringify({ courseId: event.courseId, titulo, descripcion, fechaHoraInicio, fechaHoraFin }),
  });
  await fetchSchedule();
  renderSchedule();
}

async function deleteEvent(id) {
  if (!confirm('¿Eliminar evento?')) return;
  await apiFetch(`/api/schedule/${id}`, { method: 'DELETE' });
  await fetchSchedule();
  renderSchedule();
}

function renderProgress() {
  if (state.user?.rol !== 'ESTUDIANTE') {
    progressContainer.innerHTML = '<p>El seguimiento de progreso está disponible para estudiantes.</p>';
    return;
  }

  if (!state.progress) {
    progressContainer.innerHTML = '<p>Sin datos de progreso disponibles.</p>';
    return;
  }

  const { resumen, cursos } = state.progress;
  progressContainer.innerHTML = `
    <h2>Resumen general</h2>
    <p>Cursos: ${resumen.totalCursos} | Módulos completados: ${resumen.completados}/${resumen.totalModulos} (${resumen.porcentajeGeneral}%)</p>
    <div class="module-list">
      ${cursos
        .map(
          (curso) => `
            <div class="module-item">
              <strong>${curso.cursoTitulo || 'Curso sin título'}</strong>
              <p>${curso.completados}/${curso.totalModulos} módulos</p>
              <div class="progress-bar"><span style="width:${curso.porcentaje}%"></span></div>
            </div>
          `
        )
        .join('')}
    </div>
  `;
}

async function refreshCoursesData() {
  await Promise.all([fetchCourses(), fetchMyCourses()]);
  renderCourses();
  renderDashboard();
  populateScheduleCourses();
}

function populateScheduleCourses() {
  if (state.user?.rol !== 'DOCENTE') return;
  scheduleCourseSelect.innerHTML = '';
  state.courses
    .filter((course) => course.docenteId === state.user.id)
    .forEach((course) => {
      const option = document.createElement('option');
      option.value = course.id;
      option.textContent = course.titulo;
      scheduleCourseSelect.appendChild(option);
    });
}

async function loadInitialData() {
  if (!state.token) return;
  await Promise.all([fetchCourses(), fetchMyCourses(), fetchSchedule(), fetchProgress()]);
  renderCourses();
  renderDashboard();
  renderSchedule();
  renderProgress();
  populateScheduleCourses();
}

function initEvents() {
  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!state.token) {
        showSection('auth');
        return;
      }
      showSection(btn.dataset.section);
      if (btn.dataset.section === 'courses') {
        courseDetail.classList.add('hidden');
      }
    });
  });

  showLogin.addEventListener('click', () => showSection('auth'));
  showRegister.addEventListener('click', () => showSection('auth'));

  loginForm.addEventListener('submit', login);
  registerForm.addEventListener('submit', register);
  logoutBtn.addEventListener('click', logout);

  courseForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    courseMessage.textContent = '';
    courseMessage.className = 'form-message';
    const payload = {
      titulo: document.getElementById('courseTitle').value,
      descripcion: document.getElementById('courseDescription').value,
      nivel: document.getElementById('courseLevel').value,
    };
    try {
      const response = await apiFetch('/api/courses', { method: 'POST', body: JSON.stringify(payload) });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'No se pudo crear el curso');
      }
      courseMessage.textContent = 'Curso creado correctamente';
      courseMessage.className = 'form-message success';
      courseForm.reset();
      await refreshCoursesData();
    } catch (error) {
      courseMessage.textContent = error.message;
      courseMessage.className = 'form-message error';
    }
  });

  scheduleForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    scheduleMessage.textContent = '';
    scheduleMessage.className = 'form-message';
    const payload = {
      courseId: scheduleCourseSelect.value,
      titulo: document.getElementById('scheduleTitle').value,
      descripcion: document.getElementById('scheduleDescription').value,
      fechaHoraInicio: document.getElementById('scheduleStart').value,
      fechaHoraFin: document.getElementById('scheduleEnd').value,
    };
    try {
      const response = await apiFetch('/api/schedule', { method: 'POST', body: JSON.stringify(payload) });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'No se pudo crear el evento');
      }
      scheduleMessage.textContent = 'Evento creado';
      scheduleMessage.className = 'form-message success';
      scheduleForm.reset();
      await fetchSchedule();
      renderSchedule();
    } catch (error) {
      scheduleMessage.textContent = error.message;
      scheduleMessage.className = 'form-message error';
    }
  });

  refreshCourses.addEventListener('click', async () => {
    await refreshCoursesData();
  });

  refreshSchedule.addEventListener('click', async () => {
    await fetchSchedule();
    renderSchedule();
  });
}

async function initApp() {
  yearSpan.textContent = new Date().getFullYear();
  updateSessionUI();
  initEvents();
  if (state.token) {
    await loadInitialData();
    showSection('dashboard');
  } else {
    showSection('auth');
  }
}

initApp();