from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from main.views import FileView
from . import views

urlpatterns = [
    path("", views.index),
    path("add_user", views.addUser),
    path("save_user", views.saveUser),
    path("view_users", views.viewUsers),
    path("success", views.success),
    path("add_citizen", views.addCitizen),
    path("save_citizen", views.saveCitizen),
    path("view_citizens", views.viewCitizens),
    path(
        "wanted_citizen/<int:citizen_id>/", views.wantedCitizen, name="wanted_citizen"
    ),
    path("free_citizen/<int:citizen_id>/", views.freeCitizen, name="free_citizen"),
    path("login", views.login),
    path("logout", views.logout_view),
    path("detectImage", views.detectImage),
    path("detectWithWebcam", views.detectWithWebcam),
    path("upload", FileView.as_view(), name="file-upload"),
    path("spotted_criminals", views.spottedCriminals),
    path(
        "thief_location/<int:thief_id>/", views.viewThiefLocation, name="thief_location"
    ),
    path("found_thief/<int:thief_id>/", views.foundThief, name="found_thief"),
    path("reports", views.viewReports),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
