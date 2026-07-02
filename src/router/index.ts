import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guest: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'reports',
          component: () => import('@/views/ReportListView.vue'),
        },
        {
          path: 'reports/new',
          name: 'report-new',
          component: () => import('@/views/ReportEditorView.vue'),
          meta: { editorMode: 'current' },
        },
        {
          path: 'reports/backfill',
          name: 'report-backfill',
          component: () => import('@/views/ReportEditorView.vue'),
          meta: { editorMode: 'backfill' },
        },
        {
          path: 'reports/:id/edit',
          name: 'report-edit',
          component: () => import('@/views/ReportEditorView.vue'),
          meta: { editorMode: 'edit' },
        },
        {
          path: 'reports/:id',
          name: 'report-detail',
          component: () => import('@/views/ReportDetailView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const { data: { session } } = await supabase.auth.getSession()
  const isLoggedIn = !!session

  if (to.meta.requiresAuth && !isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guest && isLoggedIn) {
    return { name: 'reports' }
  }
})

export default router
