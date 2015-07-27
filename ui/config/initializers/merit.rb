# Use this hook to configure merit parameters
Merit.setup do |config|
  # Check rules on each request or in background
  #config.checks_on_each_request = true

  # Define ORM. Could be :active_record (default) and :mongoid
  # config.orm = :active_record

  # Add application observers to get notifications when reputation changes.
  # config.add_observer 'MyObserverClassName'

  # Define :user_model_name. This model will be used to grand badge if no
  # `:to` option is given. Default is 'User'.
  config.user_model_name = 'Trip'

  # Define :current_user_method. Similar to previous option. It will be used
  # to retrieve :user_model_name object if no `:to` option is given. Default
  # is "current_#{user_model_name.downcase}".
  #config.current_user_method = 'trip'
end

Merit::Badge.create!(
  id: 1,
  name: "speed-demon",
  description: "You drove more than 90mph on this trip.  Slow the fuck down!",
  custom_fields: { icon: 'rocket', type: 'danger' }
)

Merit::Badge.create!(
  id: 2,
  name: "awesome-power",
  description: "You floored it.  Stop racing.",
  custom_fields: { icon: 'tachometer', type: 'danger' }
)

Merit::Badge.create!(
  id: 3,
  name: "go-west-young-man",
  description: "This is the farthest west you've been.",
  custom_fields: { icon: 'arrow-left', type: 'success' }
)

Merit::Badge.create!(
  id: 4,
  name: "to-the-sea",
  description: "Stop before you hit the water.",
  custom_fields: { icon: 'arrow-right', type: 'success' }
)

Merit::Badge.create!(
  id: 5,
  name: "the-great-white-north",
  description: "You going to Canada, eh?",
  custom_fields: { icon: 'arrow-up', type: 'success' }
)

Merit::Badge.create!(
  id: 6,
  name: "southern-living",
  description: "The south is full of bugs.",
  custom_fields: { icon: 'arrow-down', type: 'success' }
)

Merit::Badge.create!(
  id: 7,
  name: "top-speed",
  description: "This is the fastest you've gone on record.  Are you proud?",
  custom_fields: { icon: 'trophy', type: 'danger' }
)

Merit::Badge.create!(
  id: 8,
  name: "coming-down-the-mountain",
  description: "You picked up a lot of energy regen.  Great work!",
  custom_fields: { icon: 'power-off', type: 'success' }
)

Merit::Badge.create!(
  id: 9,
  name: "range-surfer",
  description: "Less than 20% charge.  Range anxiety?",
  custom_fields: { icon: 'exclamation-triangle', type: 'warning' }
)

## Badge Ideas
# Fastest 1-3 on any given route
# High energy regen
# Soc below 20%
# Longest distance traveled
# Traveled over N miles with energy consumption below Y%

# Create application badges (uses https://github.com/norman/ambry)
# badge_id = 0
# [{
#   id: (badge_id = badge_id+1),
#   name: 'just-registered'
# }, {
#   id: (badge_id = badge_id+1),
#   name: 'best-unicorn',
#   custom_fields: { category: 'fantasy' }
# }].each do |attrs|
#   Merit::Badge.create! attrs
# end
