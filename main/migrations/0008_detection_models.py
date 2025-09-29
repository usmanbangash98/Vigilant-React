# Generated migration for detection tracking models

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0007_person_age_person_crime_type_person_description_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='DetectionEvent',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image_name', models.CharField(max_length=255)),
                ('image_path', models.CharField(max_length=500)),
                ('total_faces_detected', models.IntegerField(default=0)),
                ('known_faces_matched', models.IntegerField(default=0)),
                ('unknown_faces_detected', models.IntegerField(default=0)),
                ('processing_time_seconds', models.FloatField(default=0.0)),
                ('detection_method', models.CharField(default='image_upload', max_length=50)),
                ('user_id', models.IntegerField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='DetectionMatch',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('confidence_score', models.FloatField(default=0.0)),
                ('is_match', models.BooleanField(default=False)),
                ('face_top', models.IntegerField(default=0)),
                ('face_right', models.IntegerField(default=0)),
                ('face_bottom', models.IntegerField(default=0)),
                ('face_left', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('detection_event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='matches', to='main.detectionevent')),
                ('matched_person', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='main.person')),
            ],
        ),
    ]
