class BadgeEngine

  @@badge_processor_classes = [
  ]

  def initialize(trip_detail)
    @badge_processors = []

    # Init all badge processors
    @@badge_processor_classes.each do |clazz|
      @badge_processors.push(clazz.constantize.new(trip_detail))
    end
  end

  def process_metric(vehicle_telemetry_metric)
    @badge_processors.each do |bp|
      bp.process_metric(vehicle_telemetry_metric)
    end
  end

  def metrics_complete()
    @badge_processors.each do |bp|
      bp.metrics_complete
    end
  end

end