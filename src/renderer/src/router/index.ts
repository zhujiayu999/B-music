import { createRouter, createWebHashHistory } from 'vue-router'
import Recommend from '../mod/content/contents/Recommend.vue'
import SearchContents from '../mod/content/contents/SearchContents.vue'
import Settings from '../mod/content/contents/Settings.vue'
import BMusicAccountSettings from '../mod/content/contents/BMusicAccountSettings.vue'
import PlayListContents from '../mod/content/contents/PlayListContents.vue'
import PlayListContentsNoLoc from '../mod/content/contents/PlayListContentsNoLoc.vue'
import EditPlayListInfo from '../mod/content/contents/EditPlayListInfo.vue'
import EditMusicInfo from '../mod/content/contents/EditMusicInfo.vue'
import BilibiliFavorites from '../mod/content/contents/BilibiliFavorites.vue'
import NeteaseLiked from '../mod/content/contents/NeteaseLiked.vue'

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            name: 'Recommend',
            component: Recommend
        },
        {
            path: '/search',
            name: 'Search',
            component: SearchContents,
            props: route => ({ keyword: route.query.keyword || '音乐' })
        },
        {
            path: '/settings',
            name: 'Settings',
            component: Settings
        },
        {
            path: '/account',
            name: 'Account',
            component: BMusicAccountSettings
        },
        {
            path: '/playlist/:musicListName',
            name: 'PlayList',
            component: PlayListContents,
            props: true
        },
        {
            path: '/playlist-no-loc',
            name: 'PlayListNoLoc',
            component: PlayListContentsNoLoc,
            // We will pass complex list data via history state or a store
        },
        {
            path: '/edit-playlist/:musicListName',
            name: 'EditPlayList',
            component: EditPlayListInfo,
            props: true
        },
        {
            path: '/edit-music/:musicListName/:editIndex',
            name: 'EditMusic',
            component: EditMusicInfo,
            props: route => ({
                musicListName: route.params.musicListName,
                editIndex: parseInt(route.params.editIndex as string, 10)
            })
        },
        {
            path: '/bilibili-favorites',
            name: 'BilibiliFavorites',
            component: BilibiliFavorites
        },
        {
            path: '/netease-liked',
            name: 'NeteaseLiked',
            component: NeteaseLiked
        }
    ]
})

export default router
