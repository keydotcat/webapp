import Vue from 'vue'
import VueRouter from 'vue-router'

import PublicDispatcher from '@/components/public_dispatcher'
import LoginPage from '@/components/public/login_page'
import RegisterPage from '@/components/public/register_page'
import ConfirmEmailPage from '@/components/public/confirm_email_page'
import ResendEmailPage from '@/components/public/resend_email_page'

import HomePage from '@/components/home_page'

import DataContent from '@/components/home/data_content'
import LocationsPage from '@/components/home/data/locations_page'
import NotesPage from '@/components/home/data/notes_page'
import NewLocationPage from '@/components/home/data/new_location_page'
import NewNotePage from '@/components/home/data/new_note_page'
import EditLocationPage from '@/components/home/data/edit_location_page'
import EditNotePage from '@/components/home/data/edit_note_page'
import NewTeamPage from '@/components/home/new_team_page'
import ManageContent from '@/components/home/manage_content'
import UserInfoPage from '@/components/home/manage/user_info_page'
import UserImportPage from '@/components/home/manage/user_import_page'
import UserExportPage from '@/components/home/manage/user_export_page'
import ManageTeamContent from '@/components/home/manage/team_content'
import ManageUsersPage from '@/components/home/manage/users_page'
import ManageVaultsPage from '@/components/home/manage/vaults_page'

import rootSvc from '@/services/root'

Vue.use(VueRouter)

var router = new VueRouter({
  routes: [
    { path: '/home',
      name: 'home',
      component: HomePage,
      children: [
        {
          path: 'data',
          component: DataContent,
          children: [
            { path: 'new_location', component: NewLocationPage },
            { path: 'locations', component: LocationsPage },
            { path: 'location/:sid', component: EditLocationPage },
            { path: 'new_note', component: NewNotePage },
            { path: 'notes', component: NotesPage },
            { path: 'notes/:sid', component: EditNotePage }
          ]
        },
        {
          path: 'manage',
          component: ManageContent,
          children: [
            {
              path: 'new_team',
              component: NewTeamPage
            },
            {
              path: 'user/info',
              component: UserInfoPage
            },
            {
              path: 'user/import',
              component: UserImportPage
            },
            {
              path: 'user/export',
              component: UserExportPage
            },
            {
              path: 'team/:tid',
              component: ManageTeamContent,
              children: [
                { path: 'users', component: ManageUsersPage },
                { path: 'vaults', component: ManageVaultsPage }
              ]
            }
          ]
        }
      ]
    },
    { path: '/',
      component: PublicDispatcher,
      children: [
        {
          path: 'login',
          name: 'login',
          component: LoginPage
        },
        {
          path: 'register',
          name: 'register',
          component: RegisterPage
        },
        {
          path: 'confirm_email',
          component: ConfirmEmailPage
        },
        {
          path: 'confirm_email/:token',
          component: ConfirmEmailPage
        },
        {
          path: 'resend_email',
          component: ResendEmailPage
        }
      ],
      redirect: '/login'
    }
  ]
})

router.beforeEach((to, from, next) => {
  var isLogged = rootSvc.isLoggedIn()
  if (to.path.indexOf('/home') === 0) {
    if (!isLogged) {
      next('/')
      return
    }
  } else {
    if (isLogged) {
      next('/home')
      return
    }
  }
  next()
})

export default router
