from django.urls import path
from . import api_views

urlpatterns = [
    path('login', api_views.api_login, name='api_login'),
    path('current-user', api_views.api_current_user, name='api_current_user'),
    path('logout', api_views.api_logout, name='api_logout'),
    
    path('users', api_views.api_users, name='api_users'),
    path('citizens', api_views.api_citizens, name='api_citizens'),
    path('add-citizen', api_views.api_add_citizen, name='api_add_citizen'),
    path('spotted-criminals', api_views.api_spotted_criminals, name='api_spotted_criminals'),
    path('detect-image', api_views.api_detect_image, name='api_detect_image'),
    path('reports-statistics', api_views.api_reports_statistics, name='api_reports_statistics'),
    path('test-media', api_views.api_test_media, name='api_test_media'),
    path('citizen/<int:citizen_id>/<str:action>', api_views.api_update_citizen_status, name='api_update_citizen_status'),
]
