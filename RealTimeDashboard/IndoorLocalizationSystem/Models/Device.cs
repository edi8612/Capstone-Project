namespace IndoorLocalizationSystem.Models
{
    public class Device
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string MACAddress { get; set; } // Unique identifier for the device
        public float PositionX { get; set; } // X coordinate in the indoor map
        public float PositionY { get; set; } // Y coordinate in the indoor map
    }
}
