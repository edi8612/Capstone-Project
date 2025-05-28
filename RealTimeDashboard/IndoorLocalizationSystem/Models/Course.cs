namespace IndoorLocalizationSystem.Models
{
    public class Course
    {
        public string Id { get; set; } // Unique identifier for the course
        public string Name { get; set; }
        public string Location { get; set; } // Location of the course, e.g., "Room 101"
    }
}
