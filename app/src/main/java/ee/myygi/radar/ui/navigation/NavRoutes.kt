package ee.myygi.radar.ui.navigation

sealed class Screen(val route: String, val titleResId: Int) {
    object Map : Screen("map", ee.myygi.radar.R.string.nav_map)
    object Nearby : Screen("nearby", ee.myygi.radar.R.string.nav_nearby)
    object Reports : Screen("reports", ee.myygi.radar.R.string.nav_reports)
    object Submissions : Screen("submissions", ee.myygi.radar.R.string.nav_submissions)
    object Admin : Screen("admin", ee.myygi.radar.R.string.nav_admin)
    object Settings : Screen("settings", ee.myygi.radar.R.string.nav_settings)
}
