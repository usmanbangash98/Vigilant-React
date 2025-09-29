from __future__ import unicode_literals
from django.db import models

class UserManager(models.Manager):
    def validator(self, postData):
        errors = {}
        if (postData['first_name'].isalpha()) == False:
            if len(postData['first_name']) < 2:
                errors['first_name'] = "First name can not be shorter than 2 characters"

        if (postData['last_name'].isalpha()) == False:
            if len(postData['last_name']) < 2:
                errors['last_name'] = "Last name can not be shorter than 2 characters"

        if len(postData['email']) == 0:
            errors['email'] = "You must enter an email"

        if len(postData['password']) < 8:
            errors['password'] = "Password is too short!"

        return errors

class User(models.Model):
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.CharField(max_length=255,default=None)
    password = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add = True)
    updated_at = models.DateTimeField(auto_now = True)
    objects = UserManager()

class ThiefLocation(models.Model):
    name = models.CharField(max_length=255)
    national_id = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    picture = models.CharField(max_length=255)
    status = models.CharField(max_length=255)
    latitude = models.CharField(max_length=255)
    longitude = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Person(models.Model):
    name = models.CharField(max_length=255)
    national_id = models.CharField(max_length=255,default=None)
    address = models.CharField(max_length=255)
    picture = models.CharField(max_length=255)
    status = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class File(models.Model):
  file = models.FileField(blank=False, null=False)
  remark = models.CharField(max_length=20)
  timestamp = models.DateTimeField(auto_now_add=True)

class DetectionEvent(models.Model):
    # Image information
    image_name = models.CharField(max_length=255)
    image_path = models.CharField(max_length=500)
    
    # Detection statistics
    total_faces_detected = models.IntegerField(default=0)
    known_faces_matched = models.IntegerField(default=0)
    unknown_faces_detected = models.IntegerField(default=0)
    
    # Processing information
    processing_time_seconds = models.FloatField(default=0.0)
    detection_method = models.CharField(max_length=50, default='image_upload')  # 'image_upload', 'webcam', etc.
    
    # User who performed the detection
    user_id = models.IntegerField(null=True, blank=True)  # Reference to User.id
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Detection {self.id} - {self.total_faces_detected} faces ({self.known_faces_matched} known)"

class DetectionMatch(models.Model):
    # Link to the detection event
    detection_event = models.ForeignKey(DetectionEvent, on_delete=models.CASCADE, related_name='matches')
    
    # Match information
    matched_person = models.ForeignKey(Person, on_delete=models.CASCADE, null=True, blank=True)
    confidence_score = models.FloatField(default=0.0)
    is_match = models.BooleanField(default=False)
    
    # Face location in image (bounding box)
    face_top = models.IntegerField(default=0)
    face_right = models.IntegerField(default=0)
    face_bottom = models.IntegerField(default=0)
    face_left = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        if self.matched_person:
            return f"Match: {self.matched_person.name} ({self.confidence_score:.2f})"
        return f"Unknown face ({self.confidence_score:.2f})"
