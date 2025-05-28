using System.ComponentModel.DataAnnotations;

namespace IndoorLocalizationSystem.Models
{
    public class Student
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; }
        public int  CourseId { get; set; }
        //public Course course { get; set; }
        public int DeviceId { get; set; }
        public int UsertId { get; set; }
        public bool Attended { get; set; }



    }
}
